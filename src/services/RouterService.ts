import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { SavedRouter, RouterInfo, NewRouterInput } from '../types/router.types';
import { encryptText, decryptText } from '../utils/crypto';
import { MikrotikClient } from '../client/MikrotikClient';
import { AppError } from '../utils/errors';

const DATA_DIR = path.join(process.cwd(), 'data');
const ROUTERS_FILE = path.join(DATA_DIR, 'routers.json');

export class RouterService {
  private static instance: RouterService;

  private constructor() {
    this.ensureStorage();
  }

  public static getInstance(): RouterService {
    if (!RouterService.instance) {
      RouterService.instance = new RouterService();
    }
    return RouterService.instance;
  }

  private ensureStorage(): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(ROUTERS_FILE)) {
      // Initialize with default router from env if available
      const defaultRouter: SavedRouter[] = [];
      const envHost = process.env.ROUTEROS_HOST || '192.168.88.1';
      const envUser = process.env.ROUTEROS_USER || 'admin';
      const envPass = process.env.ROUTEROS_PASSWORD || '';
      const envPort = process.env.ROUTEROS_PORT ? parseInt(process.env.ROUTEROS_PORT, 10) : 80;
      const envSsl = process.env.ROUTEROS_SSL === 'true';

      defaultRouter.push({
        id: 'default-router',
        name: 'الراوتر الافتراضي (Default Router)',
        host: envHost,
        port: envPort,
        username: envUser,
        encryptedPassword: encryptText(envPass),
        ssl: envSsl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      fs.writeFileSync(ROUTERS_FILE, JSON.stringify(defaultRouter, null, 2), 'utf-8');
    }
  }

  private readAll(): SavedRouter[] {
    this.ensureStorage();
    try {
      const content = fs.readFileSync(ROUTERS_FILE, 'utf-8');
      return JSON.parse(content) as SavedRouter[];
    } catch {
      return [];
    }
  }

  private writeAll(routers: SavedRouter[]): void {
    fs.writeFileSync(ROUTERS_FILE, JSON.stringify(routers, null, 2), 'utf-8');
  }

  /**
   * Convert SavedRouter to public RouterInfo (never expose encrypted or decrypted password)
   */
  private toPublicInfo(router: SavedRouter, status: RouterInfo['status'] = 'unknown'): RouterInfo {
    return {
      id: router.id,
      name: router.name,
      host: router.host,
      port: router.port,
      username: router.username,
      ssl: router.ssl,
      status,
      createdAt: router.createdAt,
      updatedAt: router.updatedAt,
    };
  }

  /**
   * Get list of all registered routers (without passwords)
   */
  async getAll(): Promise<RouterInfo[]> {
    const routers = this.readAll();
    return routers.map((r) => this.toPublicInfo(r));
  }

  /**
   * Get single router by ID
   */
  async getById(id: string): Promise<SavedRouter> {
    const routers = this.readAll();
    const found = routers.find((r) => r.id === id);
    if (!found) {
      throw new AppError(`Router with ID (${id}) not found`, 404);
    }
    return found;
  }

  /**
   * Add new router (tests connection before saving)
   */
  async addRouter(input: NewRouterInput, testConnectionFirst = false): Promise<RouterInfo> {
    const routers = this.readAll();
    const port = input.port ?? (input.ssl ? 443 : 80);

    if (testConnectionFirst) {
      // Test connectivity
      const testClient = new MikrotikClient({
        host: input.host,
        port,
        username: input.username,
        password: input.password,
        ssl: input.ssl,
        timeout: 4000,
      });
      await testClient.getSystemIdentity();
    }

    const newRouter: SavedRouter = {
      id: `router_${crypto.randomBytes(6).toString('hex')}`,
      name: input.name.trim(),
      host: input.host.trim(),
      port,
      username: input.username.trim(),
      encryptedPassword: encryptText(input.password),
      ssl: input.ssl === true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    routers.push(newRouter);
    this.writeAll(routers);

    return this.toPublicInfo(newRouter, 'online');
  }

  /**
   * Delete router by ID
   */
  async deleteRouter(id: string): Promise<{ success: boolean; id: string }> {
    const routers = this.readAll();
    const filtered = routers.filter((r) => r.id !== id);
    if (filtered.length === routers.length) {
      throw new AppError(`Router with ID (${id}) not found`, 404);
    }
    this.writeAll(filtered);
    return { success: true, id };
  }

  /**
   * Check connection status to a router
   */
  async checkStatus(id: string): Promise<{
    id: string;
    name: string;
    host: string;
    status: 'online' | 'offline' | 'unauthorized';
    identity?: string;
    uptime?: string;
    cpuLoad?: string | number;
    error?: string;
  }> {
    const router = await this.getById(id);
    const password = decryptText(router.encryptedPassword);

    const client = new MikrotikClient({
      host: router.host,
      port: router.port,
      username: router.username,
      password,
      ssl: router.ssl,
      timeout: 3500,
    });

    try {
      const [identityRes, resourceRes] = await Promise.all([
        client.getSystemIdentity().catch(() => ({ name: 'MikroTik' })),
        client.getSystemResource().catch(() => ({} as Record<string, unknown>)),
      ]);

      return {
        id: router.id,
        name: router.name,
        host: router.host,
        status: 'online',
        identity: identityRes.name,
        uptime: typeof resourceRes.uptime === 'string' ? resourceRes.uptime : undefined,
        cpuLoad: (resourceRes['cpu-load'] as string | number | undefined),
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      const isAuth = msg.includes('401') || msg.includes('unauthorized');
      return {
        id: router.id,
        name: router.name,
        host: router.host,
        status: isAuth ? 'unauthorized' : 'offline',
        error: msg,
      };
    }
  }

  /**
   * Create an authenticated MikrotikClient for a saved router ID
   */
  async getClientForRouter(id: string): Promise<MikrotikClient> {
    const router = await this.getById(id);
    const password = decryptText(router.encryptedPassword);

    return new MikrotikClient({
      host: router.host,
      port: router.port,
      username: router.username,
      password,
      ssl: router.ssl,
      timeout: 5000,
    });
  }
}
