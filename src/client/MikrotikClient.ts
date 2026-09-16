import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, isAxiosError } from 'axios';
import https from 'https';
import { RouterCredentials } from '../types/router.types';
import {
  HotspotUser,
  NewHotspotUser,
  UpdateHotspotUser,
  HotspotActiveSession,
  BulkCreateHotspotResult,
  HotspotProfile,
  NewHotspotProfile,
} from '../types/hotspot.types';
import { MikrotikApiError } from '../utils/errors';

export class MikrotikClient {
  private client: AxiosInstance;
  public readonly host: string;
  public readonly port: number;
  public readonly timeoutMs: number;

  constructor(creds: RouterCredentials) {
    const isSsl = creds.ssl === true;
    const defaultPort = isSsl ? 443 : 80;
    const resolvedPort = creds.port ?? defaultPort;
    const protocol = isSsl ? 'https' : 'http';

    this.host = creds.host;
    this.port = resolvedPort;
    this.timeoutMs = creds.timeout ?? 3000;

    const httpsAgent = isSsl
      ? new https.Agent({ rejectUnauthorized: false })
      : undefined;

    this.client = axios.create({
      baseURL: `${protocol}://${creds.host}:${resolvedPort}/rest`,
      auth: {
        username: creds.username,
        password: creds.password,
      },
      timeout: this.timeoutMs,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      httpsAgent,
      validateStatus: () => true, // inspect all statuses manually for custom RouterOS error handling
    });
  }

  /**
   * Safe request dispatcher that inspects RouterOS payload and status codes
   */
  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse = await this.client.request({
        ...config,
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      // RouterOS error detection
      const data = response.data;
      if (data && typeof data === 'object' && ('error' in data || 'detail' in data)) {
        const errorMsg = data.detail || data.message || `RouterOS Error: ${JSON.stringify(data)}`;
        const statusCode = typeof data.error === 'number' ? data.error : response.status;
        throw new MikrotikApiError(errorMsg, statusCode >= 400 ? statusCode : 400, data);
      }

      if (response.status >= 400) {
        const msg = typeof data === 'string' ? data : (data?.detail || data?.message || `HTTP ${response.status}`);
        throw new MikrotikApiError(`RouterOS API Error (${response.status}): ${msg}`, response.status, data);
      }

      return response.data as T;
    } catch (err: unknown) {
      if (err instanceof MikrotikApiError) {
        throw err;
      }
      if (isAxiosError(err)) {
        if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED' || err.code === 'ERR_CANCELED' || err.name === 'CanceledError') {
          throw new MikrotikApiError(
            `تعذر الوصول إلى راوتر ميكروتك على ${this.host}:${this.port} (Timeout). يرجى التأكد من تشغيل الراوتر وتفعيل خدمة REST API وصحة العنوان والمنفذ.`,
            504,
            { code: err.code || 'TIMEOUT' }
          );
        }
        throw new MikrotikApiError(err.message, err.response?.status || 502, err.response?.data);
      }
      throw new MikrotikApiError(err instanceof Error ? err.message : 'Unknown RouterOS communication failure', 502);
    }
  }

  // ==========================================
  // Hotspot Users Management
  // ==========================================

  /**
   * GET /rest/ip/hotspot/user
   * Optionally filtered by proplist
   */
  async getHotspotUsers(proplist?: string[]): Promise<HotspotUser[]> {
    const params: Record<string, string> = {};
    if (proplist && proplist.length > 0) {
      params['.proplist'] = proplist.join(',');
    }
    return this.request<HotspotUser[]>({
      method: 'GET',
      url: '/ip/hotspot/user',
      params,
    });
  }

  /**
   * GET /rest/ip/hotspot/user/*ID
   */
  async getHotspotUser(id: string): Promise<HotspotUser> {
    const cleanId = id.startsWith('*') ? id : `*${id}`;
    return this.request<HotspotUser>({
      method: 'GET',
      url: `/ip/hotspot/user/${encodeURIComponent(cleanId)}`,
    });
  }

  /**
   * PUT /rest/ip/hotspot/user (Create User)
   * RouterOS uses PUT for creating entities
   */
  async addHotspotUser(user: NewHotspotUser): Promise<HotspotUser> {
    return this.request<HotspotUser>({
      method: 'PUT',
      url: '/ip/hotspot/user',
      data: user,
    });
  }

  /**
   * PATCH /rest/ip/hotspot/user/*ID (Update User)
   */
  async updateHotspotUser(id: string, changes: UpdateHotspotUser): Promise<HotspotUser> {
    const cleanId = id.startsWith('*') ? id : `*${id}`;
    return this.request<HotspotUser>({
      method: 'PATCH',
      url: `/ip/hotspot/user/${encodeURIComponent(cleanId)}`,
      data: changes,
    });
  }

  /**
   * DELETE /rest/ip/hotspot/user/*ID (Single User Deletion)
   */
  async deleteHotspotUser(id: string): Promise<{ success: boolean; id: string }> {
    const cleanId = id.startsWith('*') ? id : `*${id}`;
    await this.request({
      method: 'DELETE',
      url: `/ip/hotspot/user/${encodeURIComponent(cleanId)}`,
    });
    return { success: true, id: cleanId };
  }

  /**
   * POST /rest/ip/hotspot/user/remove with { numbers: "*1A,*2B,..." }
   * Official RouterOS REST API bulk removal method
   */
  async deleteBulkHotspotUsers(ids: string[]): Promise<{ success: boolean; deletedCount: number }> {
    if (!ids || ids.length === 0) {
      return { success: true, deletedCount: 0 };
    }
    const formattedIds = ids.map((id) => (id.startsWith('*') ? id : `*${id}`)).join(',');

    await this.request({
      method: 'POST',
      url: '/ip/hotspot/user/remove',
      data: {
        numbers: formattedIds,
      },
    });

    return { success: true, deletedCount: ids.length };
  }

  /**
   * Bulk Create Hotspot Users with Concurrency Throttling
   */
  async bulkCreateHotspotUsers(users: NewHotspotUser[], concurrency = 5): Promise<BulkCreateHotspotResult> {
    const result: BulkCreateHotspotResult = {
      success: true,
      totalRequested: users.length,
      successCount: 0,
      failedCount: 0,
      createdUsers: [],
      errors: [],
    };

    // Process in batches of `concurrency` to avoid spiking RouterOS CPU
    for (let i = 0; i < users.length; i += concurrency) {
      const batch = users.slice(i, i + concurrency);
      await Promise.allSettled(
        batch.map(async (u) => {
          try {
            await this.addHotspotUser(u);
            result.successCount++;
            result.createdUsers.push(u.name);
          } catch (err: unknown) {
            result.failedCount++;
            const msg = err instanceof Error ? err.message : 'Creation failed';
            result.errors.push({ name: u.name, error: msg });
          }
        })
      );
    }

    result.success = result.failedCount === 0;
    return result;
  }

  // ==========================================
  // Hotspot Active Sessions
  // ==========================================

  /**
   * GET /rest/ip/hotspot/active
   */
  async getActiveHotspotSessions(): Promise<HotspotActiveSession[]> {
    return this.request<HotspotActiveSession[]>({
      method: 'GET',
      url: '/ip/hotspot/active',
    });
  }

  /**
   * DELETE /rest/ip/hotspot/active/*ID
   * Terminate active user session
   */
  async kickHotspotSession(activeId: string): Promise<{ success: boolean; activeId: string }> {
    const cleanId = activeId.startsWith('*') ? activeId : `*${activeId}`;
    await this.request({
      method: 'DELETE',
      url: `/ip/hotspot/active/${encodeURIComponent(cleanId)}`,
    });
    return { success: true, activeId: cleanId };
  }

  // ==========================================
  // Hotspot Profiles Management
  // ==========================================

  /**
   * GET /rest/ip/hotspot/user/profile
   */
  async getHotspotProfiles(): Promise<HotspotProfile[]> {
    return this.request<HotspotProfile[]>({
      method: 'GET',
      url: '/ip/hotspot/user/profile',
    });
  }

  /**
   * GET /rest/ip/hotspot/user/profile/*ID
   */
  async getHotspotProfile(id: string): Promise<HotspotProfile> {
    const cleanId = id.startsWith('*') ? id : `*${id}`;
    return this.request<HotspotProfile>({
      method: 'GET',
      url: `/ip/hotspot/user/profile/${encodeURIComponent(cleanId)}`,
    });
  }

  /**
   * PUT /rest/ip/hotspot/user/profile (Create Profile)
   */
  async addHotspotProfile(profile: NewHotspotProfile): Promise<HotspotProfile> {
    return this.request<HotspotProfile>({
      method: 'PUT',
      url: '/ip/hotspot/user/profile',
      data: profile,
    });
  }

  /**
   * PATCH /rest/ip/hotspot/user/profile/*ID (Update Profile)
   */
  async updateHotspotProfile(id: string, changes: Partial<NewHotspotProfile>): Promise<HotspotProfile> {
    const cleanId = id.startsWith('*') ? id : `*${id}`;
    return this.request<HotspotProfile>({
      method: 'PATCH',
      url: `/ip/hotspot/user/profile/${encodeURIComponent(cleanId)}`,
      data: changes,
    });
  }

  /**
   * DELETE /rest/ip/hotspot/user/profile/*ID
   */
  async deleteHotspotProfile(id: string): Promise<{ success: boolean; id: string }> {
    const cleanId = id.startsWith('*') ? id : `*${id}`;
    await this.request({
      method: 'DELETE',
      url: `/ip/hotspot/user/profile/${encodeURIComponent(cleanId)}`,
    });
    return { success: true, id: cleanId };
  }

  // ==========================================
  // System Endpoints
  // ==========================================

  /**
   * GET /rest/system/identity
   */
  async getSystemIdentity(): Promise<{ name: string; [key: string]: unknown }> {
    return this.request<{ name: string }>({
      method: 'GET',
      url: '/system/identity',
    });
  }

  /**
   * GET /rest/system/resource
   */
  async getSystemResource(): Promise<{
    uptime?: string;
    version?: string;
    'cpu-load'?: number | string;
    'free-memory'?: number | string;
    'total-memory'?: number | string;
    'free-hdd-space'?: number | string;
    'total-hdd-space'?: number | string;
    'board-name'?: string;
    [key: string]: unknown;
  }> {
    return this.request({
      method: 'GET',
      url: '/system/resource',
    });
  }
}
