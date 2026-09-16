import { MikrotikClient } from '../client/MikrotikClient';
import {
  HotspotUser,
  NewHotspotUser,
  UpdateHotspotUser,
  HotspotActiveSession,
  BulkCreateHotspotResult,
  HotspotProfile,
  NewHotspotProfile,
} from '../types/hotspot.types';
import { RouterCredentials } from '../types/router.types';
import { AppError } from '../utils/errors';

export class HotspotService {
  private client: MikrotikClient;

  constructor(client: MikrotikClient) {
    this.client = client;
  }

  /**
   * Helper factory to build service from router credentials
   */
  static fromCredentials(creds: RouterCredentials): HotspotService {
    const client = new MikrotikClient(creds);
    return new HotspotService(client);
  }

  /**
   * Helper factory using environment variables
   */
  static fromEnv(): HotspotService {
    const host = process.env.ROUTEROS_HOST || '192.168.88.1';
    const username = process.env.ROUTEROS_USER || 'admin';
    const password = process.env.ROUTEROS_PASSWORD || '';
    const port = process.env.ROUTEROS_PORT ? parseInt(process.env.ROUTEROS_PORT, 10) : 80;
    const ssl = process.env.ROUTEROS_SSL === 'true';

    return HotspotService.fromCredentials({ host, username, password, port, ssl });
  }

  async getAllUsers(proplist?: string[]): Promise<HotspotUser[]> {
    return this.client.getHotspotUsers(proplist);
  }

  async getUserById(id: string): Promise<HotspotUser> {
    if (!id) {
      throw new AppError('User ID is required', 400);
    }
    return this.client.getHotspotUser(id);
  }

  async createUser(data: NewHotspotUser): Promise<HotspotUser> {
    if (!data.name || !data.password) {
      throw new AppError('Username and password are required', 400);
    }
    return this.client.addHotspotUser(data);
  }

  async updateUser(id: string, data: UpdateHotspotUser): Promise<HotspotUser> {
    if (!id) {
      throw new AppError('User ID is required', 400);
    }
    return this.client.updateHotspotUser(id, data);
  }

  async deleteUser(id: string): Promise<{ success: boolean; id: string }> {
    if (!id) {
      throw new AppError('User ID is required', 400);
    }
    return this.client.deleteHotspotUser(id);
  }

  async bulkDeleteUsers(ids: string[]): Promise<{ success: boolean; deletedCount: number }> {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError('Array of user IDs is required for bulk delete', 400);
    }
    return this.client.deleteBulkHotspotUsers(ids);
  }

  async bulkCreateUsers(users: NewHotspotUser[], concurrency?: number): Promise<BulkCreateHotspotResult> {
    if (!Array.isArray(users) || users.length === 0) {
      throw new AppError('Array of users is required for bulk creation', 400);
    }
    return this.client.bulkCreateHotspotUsers(users, concurrency);
  }

  async getActiveSessions(): Promise<HotspotActiveSession[]> {
    return this.client.getActiveHotspotSessions();
  }

  async kickSession(id: string): Promise<{ success: boolean; activeId: string }> {
    if (!id) {
      throw new AppError('Active session ID is required to kick user', 400);
    }
    return this.client.kickHotspotSession(id);
  }

  // ==========================================
  // Profiles Management
  // ==========================================

  async getAllProfiles(): Promise<HotspotProfile[]> {
    return this.client.getHotspotProfiles();
  }

  async getProfileById(id: string): Promise<HotspotProfile> {
    if (!id) {
      throw new AppError('Profile ID is required', 400);
    }
    return this.client.getHotspotProfile(id);
  }

  async createProfile(data: NewHotspotProfile): Promise<HotspotProfile> {
    if (!data.name) {
      throw new AppError('Profile name is required', 400);
    }
    return this.client.addHotspotProfile(data);
  }

  async updateProfile(id: string, data: Partial<NewHotspotProfile>): Promise<HotspotProfile> {
    if (!id) {
      throw new AppError('Profile ID is required', 400);
    }
    return this.client.updateHotspotProfile(id, data);
  }

  async deleteProfile(id: string): Promise<{ success: boolean; id: string }> {
    if (!id) {
      throw new AppError('Profile ID is required', 400);
    }
    return this.client.deleteHotspotProfile(id);
  }
}
