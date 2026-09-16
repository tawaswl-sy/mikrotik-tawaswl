import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  HotspotBatch,
  BatchVoucherCard,
  GenerateBatchInput,
  CharacterSetType,
  NewHotspotUser,
} from '../types/hotspot.types';
import { RouterService } from './RouterService';
import { HotspotService } from './HotspotService';
import { AppError } from '../utils/errors';

const DATA_DIR = path.join(process.cwd(), 'data');
const BATCHES_FILE = path.join(DATA_DIR, 'batches.json');

const CHAR_SETS: Record<CharacterSetType, string> = {
  numeric: '0123456789',
  alphanumeric: '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ',
  uppercase: '23456789ABCDEFGHJKLMNPQRSTUVWXYZ',
  'easy-read': '346789ABCDEFGHJKLMNPQRTUVWXY', // removes easily confused characters (0, O, o, 1, I, l, 2, Z, 5, S)
};

export class BatchService {
  private static instance: BatchService;

  private constructor() {
    this.ensureStorage();
  }

  public static getInstance(): BatchService {
    if (!BatchService.instance) {
      BatchService.instance = new BatchService();
    }
    return BatchService.instance;
  }

  private ensureStorage(): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(BATCHES_FILE)) {
      fs.writeFileSync(BATCHES_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  private readAll(): HotspotBatch[] {
    this.ensureStorage();
    try {
      const content = fs.readFileSync(BATCHES_FILE, 'utf-8');
      return JSON.parse(content) as HotspotBatch[];
    } catch {
      return [];
    }
  }

  private writeAll(batches: HotspotBatch[]): void {
    fs.writeFileSync(BATCHES_FILE, JSON.stringify(batches, null, 2), 'utf-8');
  }

  /**
   * Generates a random string using crypto and specified character set
   */
  private generateRandomCode(length: number, charSet: CharacterSetType): string {
    const chars = CHAR_SETS[charSet] || CHAR_SETS.numeric;
    let result = '';

    // If numeric, avoid leading zero so number representation is clean
    if (charSet === 'numeric') {
      const nonZero = '123456789';
      result += nonZero.charAt(crypto.randomInt(0, nonZero.length));
      for (let i = 1; i < length; i++) {
        result += chars.charAt(crypto.randomInt(0, chars.length));
      }
    } else {
      for (let i = 0; i < length; i++) {
        result += chars.charAt(crypto.randomInt(0, chars.length));
      }
    }

    return result;
  }

  /**
   * Generates a new batch of voucher cards and optionally pushes them to MikroTik
   */
  async generateBatch(input: GenerateBatchInput): Promise<HotspotBatch> {
    const quantity = Math.max(1, Math.min(input.quantity || 10, 500));
    const prefix = input.prefix !== undefined ? input.prefix.trim() : 'card_';
    const codeLength = Math.max(4, Math.min(input.codeLength || 6, 16));
    const charSet = input.characterSet || 'numeric';
    const accountMode = input.accountMode || 'user_pass';
    const routerId = input.routerId || 'default-router';
    const profile = input.profile.trim();
    const price = input.price?.trim() || '5$';
    const reseller = input.reseller?.trim() || 'الدفعة العامة';
    const batchName = input.name?.trim() || `دفعة ${profile} - ${new Date().toLocaleDateString('ar-EG')}`;

    const batchId = `batch_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const nowIso = new Date().toISOString();

    const usedUsernames = new Set<string>();
    const cards: BatchVoucherCard[] = [];

    // Calculate bytes limit if MB provided
    const limitBytesTotal = input.dataLimitMB && input.dataLimitMB > 0
      ? input.dataLimitMB * 1024 * 1024
      : undefined;

    for (let i = 0; i < quantity; i++) {
      let code = this.generateRandomCode(codeLength, charSet);
      let username = accountMode === 'pin_only' ? code : `${prefix}${code}`;

      // Avoid duplicates inside same batch
      let attempts = 0;
      while (usedUsernames.has(username) && attempts < 100) {
        code = this.generateRandomCode(codeLength, charSet);
        username = accountMode === 'pin_only' ? code : `${prefix}${code}`;
        attempts++;
      }
      usedUsernames.add(username);

      let password = '';
      if (accountMode === 'user_equals_pass' || accountMode === 'pin_only') {
        password = username;
      } else {
        // user_pass mode
        password = this.generateRandomCode(codeLength, charSet === 'numeric' ? 'numeric' : 'alphanumeric');
      }

      cards.push({
        id: `card_${crypto.randomBytes(6).toString('hex')}`,
        username,
        password,
        profile,
        limitUptime: input.timeLimit,
        limitBytesTotal,
        price,
        reseller,
        comment: `Batch:${batchId}`,
        status: 'unused',
        createdAt: nowIso,
      });
    }

    let syncedToRouter = false;

    // Direct synchronization to MikroTik RouterOS
    if (input.syncToRouter) {
      try {
        const client = await RouterService.getInstance().getClientForRouter(routerId);
        const hotspotService = new HotspotService(client);

        const routerUsers: NewHotspotUser[] = cards.map((c) => ({
          name: c.username,
          password: c.password,
          profile: c.profile,
          'limit-uptime': c.limitUptime,
          'limit-bytes-total': c.limitBytesTotal,
          comment: c.comment,
        }));

        const syncResult = await hotspotService.bulkCreateUsers(routerUsers, 5);
        if (syncResult.successCount > 0) {
          syncedToRouter = true;
        }
      } catch (err) {
        console.warn(`[BatchService] Failed to auto-sync to router (${routerId}):`, err);
        // Continue and save locally even if router was temporarily offline
      }
    }

    const batch: HotspotBatch = {
      id: batchId,
      name: batchName,
      routerId,
      profile,
      quantity,
      price,
      reseller,
      prefix,
      codeLength,
      characterSet: charSet,
      accountMode,
      timeLimit: input.timeLimit,
      dataLimitMB: input.dataLimitMB,
      syncedToRouter,
      createdAt: nowIso,
      cards,
    };

    const batches = this.readAll();
    batches.unshift(batch); // newest first
    this.writeAll(batches);

    return batch;
  }

  /**
   * Get all generated batches (summary without full cards list for fast loading)
   */
  async getAllBatches(): Promise<Array<Omit<HotspotBatch, 'cards'> & { cardsCount: number }>> {
    const batches = this.readAll();
    return batches.map((b) => ({
      id: b.id,
      name: b.name,
      routerId: b.routerId,
      profile: b.profile,
      quantity: b.quantity,
      price: b.price,
      reseller: b.reseller,
      prefix: b.prefix,
      codeLength: b.codeLength,
      characterSet: b.characterSet,
      accountMode: b.accountMode,
      timeLimit: b.timeLimit,
      dataLimitMB: b.dataLimitMB,
      syncedToRouter: b.syncedToRouter,
      createdAt: b.createdAt,
      cardsCount: b.cards.length,
    }));
  }

  /**
   * Get full batch with all cards
   */
  async getBatchById(id: string): Promise<HotspotBatch> {
    const batches = this.readAll();
    const batch = batches.find((b) => b.id === id);
    if (!batch) {
      throw new AppError(`Batch with ID (${id}) not found`, 404);
    }
    return batch;
  }

  /**
   * Sync an unsynced batch to its target MikroTik router
   */
  async syncBatchToRouter(id: string): Promise<{ success: boolean; syncedCount: number; errors: Array<{ name: string; error: string }> }> {
    const batches = this.readAll();
    const batch = batches.find((b) => b.id === id);
    if (!batch) {
      throw new AppError(`Batch with ID (${id}) not found`, 404);
    }

    const client = await RouterService.getInstance().getClientForRouter(batch.routerId);
    const hotspotService = new HotspotService(client);

    const routerUsers: NewHotspotUser[] = batch.cards.map((c) => ({
      name: c.username,
      password: c.password,
      profile: c.profile,
      'limit-uptime': c.limitUptime,
      'limit-bytes-total': c.limitBytesTotal,
      comment: c.comment || `Batch:${batch.id}`,
    }));

    const result = await hotspotService.bulkCreateUsers(routerUsers, 5);
    batch.syncedToRouter = result.successCount > 0;
    this.writeAll(batches);

    return {
      success: result.success,
      syncedCount: result.successCount,
      errors: result.errors,
    };
  }

  /**
   * Delete batch from local store and optionally from MikroTik router
   */
  async deleteBatch(id: string, deleteFromRouter = false): Promise<{ success: boolean; id: string; deletedFromRouter: boolean }> {
    const batches = this.readAll();
    const batch = batches.find((b) => b.id === id);
    if (!batch) {
      throw new AppError(`Batch with ID (${id}) not found`, 404);
    }

    let deletedFromRouter = false;
    if (deleteFromRouter && batch.syncedToRouter) {
      try {
        const client = await RouterService.getInstance().getClientForRouter(batch.routerId);
        // Find existing users by comment or username in MikroTik
        const existingUsers = await client.getHotspotUsers();
        const userIdsToDelete = existingUsers
          .filter((u) => batch.cards.some((c) => c.username === u.name) || u.comment === `Batch:${batch.id}`)
          .map((u) => u['.id']);

        if (userIdsToDelete.length > 0) {
          await client.deleteBulkHotspotUsers(userIdsToDelete);
          deletedFromRouter = true;
        }
      } catch (err) {
        console.warn(`[BatchService] Failed to delete batch cards from router (${batch.routerId}):`, err);
      }
    }

    const filtered = batches.filter((b) => b.id !== id);
    this.writeAll(filtered);

    return { success: true, id, deletedFromRouter };
  }

  /**
   * Generate CSV format for a batch
   */
  async exportBatchCsv(id: string, loginHost = '10.0.0.1/login'): Promise<string> {
    const batch = await this.getBatchById(id);
    const cleanHost = loginHost.replace(/^https?:\/\//, '');

    let csv = '\uFEFF'; // UTF-8 BOM for Arabic in Excel
    csv += 'اسم المستخدم,كلمة المرور,الباقة,السعر,الموزع / الدفعة,مدة الصلاحية,رابط الدخول المباشر,تاريخ التوليد\n';

    for (const card of batch.cards) {
      const loginUrl = `http://${cleanHost}?username=${encodeURIComponent(card.username)}&password=${encodeURIComponent(card.password)}`;
      csv += `"${card.username}","${card.password}","${card.profile}","${card.price || batch.price}","${card.reseller || batch.reseller}","${card.limitUptime || 'غير محدد'}","${loginUrl}","${card.createdAt.split('T')[0]}"\n`;
    }

    return csv;
  }
}
