import { Request, Response } from 'express';
import { z } from 'zod';
import { HotspotService } from '../services/HotspotService';
import { MikrotikClient } from '../client/MikrotikClient';
import { RouterService } from '../services/RouterService';
import { MikrotikApiError, AppError } from '../utils/errors';

// -------------------------------------------------------------
// Zod Schemas for Request Validation
// -------------------------------------------------------------
export const createHotspotUserSchema = z.object({
  name: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  profile: z.string().optional().default('default'),
  comment: z.string().optional(),
  disabled: z.union([z.boolean(), z.enum(['true', 'false'])]).optional(),
  'limit-bytes-total': z.union([z.string(), z.number()]).optional(),
  'limit-uptime': z.string().optional(),
  'mac-address': z.string().optional(),
  server: z.string().optional(),
});

export const updateHotspotUserSchema = z.object({
  name: z.string().optional(),
  password: z.string().optional(),
  profile: z.string().optional(),
  comment: z.string().optional(),
  disabled: z.union([z.boolean(), z.enum(['true', 'false'])]).optional(),
  'limit-bytes-total': z.union([z.string(), z.number()]).optional(),
  'limit-uptime': z.string().optional(),
  'mac-address': z.string().optional(),
});

export const bulkDeleteHotspotUsersSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, 'Must provide at least one ID to delete'),
});

export const bulkCreateHotspotUsersSchema = z.object({
  users: z.array(createHotspotUserSchema).min(1, 'Must provide at least one user to create'),
  concurrency: z.number().int().min(1).max(20).optional().default(5),
});

export const createHotspotProfileSchema = z.object({
  name: z.string().min(1, 'Profile name is required'),
  'rate-limit': z.string().optional(),
  'shared-users': z.union([z.string(), z.number()]).optional(),
  'session-timeout': z.string().optional(),
  'keepalive-timeout': z.string().optional(),
  'status-autorefresh': z.string().optional(),
  'transparent-proxy': z.union([z.boolean(), z.enum(['true', 'false'])]).optional(),
  'open-status-page': z.string().optional(),
});

export const updateHotspotProfileSchema = z.object({
  name: z.string().optional(),
  'rate-limit': z.string().optional(),
  'shared-users': z.union([z.string(), z.number()]).optional(),
  'session-timeout': z.string().optional(),
  'keepalive-timeout': z.string().optional(),
  'status-autorefresh': z.string().optional(),
  'transparent-proxy': z.union([z.boolean(), z.enum(['true', 'false'])]).optional(),
  'open-status-page': z.string().optional(),
});

/**
 * Resolves the MikrotikClient for this request (supports saved router ID or direct headers)
 */
async function getClientForRequest(req: Request): Promise<MikrotikClient> {
  const routerId = (req.headers['x-router-id'] as string) || (req.query.routerId as string);
  if (routerId) {
    return RouterService.getInstance().getClientForRouter(routerId);
  }

  const host = (req.headers['x-router-host'] as string) || process.env.ROUTEROS_HOST || '192.168.88.1';
  const username = (req.headers['x-router-user'] as string) || process.env.ROUTEROS_USER || 'admin';
  const password = (req.headers['x-router-pass'] as string) || process.env.ROUTEROS_PASSWORD || '';
  const port = req.headers['x-router-port'] ? parseInt(req.headers['x-router-port'] as string, 10) : (process.env.ROUTEROS_PORT ? parseInt(process.env.ROUTEROS_PORT, 10) : 80);
  const ssl = (req.headers['x-router-ssl'] as string) === 'true' || process.env.ROUTEROS_SSL === 'true';
  const timeout = req.headers['x-router-timeout'] ? parseInt(req.headers['x-router-timeout'] as string, 10) : 3500;

  return new MikrotikClient({ host, username, password, port, ssl, timeout });
}

// -------------------------------------------------------------
// Hotspot Controller Actions
// -------------------------------------------------------------
export class HotspotController {
  /**
   * GET /api/hotspot/users
   */
  static async getAll(req: Request, res: Response) {
    try {
      const client = await getClientForRequest(req);
      const service = new HotspotService(client);
      const proplist = typeof req.query.proplist === 'string' ? req.query.proplist.split(',') : undefined;

      const users = await service.getAllUsers(proplist);
      return res.status(200).json({
        success: true,
        count: users.length,
        data: users,
      });
    } catch (err: unknown) {
      return HotspotController.handleError(res, err);
    }
  }

  /**
   * GET /api/hotspot/users/:id
   */
  static async getById(req: Request, res: Response) {
    try {
      const client = await getClientForRequest(req);
      const service = new HotspotService(client);
      const user = await service.getUserById(req.params.id);

      return res.status(200).json({
        success: true,
        data: user,
      });
    } catch (err: unknown) {
      return HotspotController.handleError(res, err);
    }
  }

  /**
   * POST /api/hotspot/users
   */
  static async create(req: Request, res: Response) {
    try {
      const validatedData = createHotspotUserSchema.parse(req.body);
      const client = await getClientForRequest(req);
      const service = new HotspotService(client);

      const createdUser = await service.createUser(validatedData);
      return res.status(201).json({
        success: true,
        message: 'Hotspot user created successfully',
        data: createdUser,
      });
    } catch (err: unknown) {
      return HotspotController.handleError(res, err);
    }
  }

  /**
   * PATCH /api/hotspot/users/:id
   */
  static async update(req: Request, res: Response) {
    try {
      const validatedData = updateHotspotUserSchema.parse(req.body);
      const client = await getClientForRequest(req);
      const service = new HotspotService(client);

      const updatedUser = await service.updateUser(req.params.id, validatedData);
      return res.status(200).json({
        success: true,
        message: 'Hotspot user updated successfully',
        data: updatedUser,
      });
    } catch (err: unknown) {
      return HotspotController.handleError(res, err);
    }
  }

  /**
   * DELETE /api/hotspot/users/:id
   */
  static async delete(req: Request, res: Response) {
    try {
      const client = await getClientForRequest(req);
      const service = new HotspotService(client);

      const result = await service.deleteUser(req.params.id);
      return res.status(200).json({
        success: true,
        message: `Hotspot user (${req.params.id}) deleted successfully`,
        data: result,
      });
    } catch (err: unknown) {
      return HotspotController.handleError(res, err);
    }
  }

  /**
   * POST /api/hotspot/users/bulk-delete
   */
  static async bulkDelete(req: Request, res: Response) {
    try {
      const { ids } = bulkDeleteHotspotUsersSchema.parse(req.body);
      const client = await getClientForRequest(req);
      const service = new HotspotService(client);

      const result = await service.bulkDeleteUsers(ids);
      return res.status(200).json({
        success: true,
        message: `Successfully deleted ${result.deletedCount} users from RouterOS`,
        data: result,
      });
    } catch (err: unknown) {
      return HotspotController.handleError(res, err);
    }
  }

  /**
   * POST /api/hotspot/users/bulk-create
   */
  static async bulkCreate(req: Request, res: Response) {
    try {
      const { users, concurrency } = bulkCreateHotspotUsersSchema.parse(req.body);
      const client = await getClientForRequest(req);
      const service = new HotspotService(client);

      const result = await service.bulkCreateUsers(users, concurrency);
      return res.status(result.success ? 201 : 207).json({
        success: result.success,
        message: `Bulk creation completed: ${result.successCount} succeeded, ${result.failedCount} failed`,
        data: result,
      });
    } catch (err: unknown) {
      return HotspotController.handleError(res, err);
    }
  }

  /**
   * GET /api/hotspot/active
   */
  static async getActive(req: Request, res: Response) {
    try {
      const client = await getClientForRequest(req);
      const service = new HotspotService(client);

      const sessions = await service.getActiveSessions();
      return res.status(200).json({
        success: true,
        count: sessions.length,
        data: sessions,
      });
    } catch (err: unknown) {
      return HotspotController.handleError(res, err);
    }
  }

  /**
   * DELETE /api/hotspot/active/:id
   */
  static async kickActive(req: Request, res: Response) {
    try {
      const client = await getClientForRequest(req);
      const service = new HotspotService(client);

      const result = await service.kickSession(req.params.id);
      return res.status(200).json({
        success: true,
        message: `Active session (${req.params.id}) terminated successfully`,
        data: result,
      });
    } catch (err: unknown) {
      return HotspotController.handleError(res, err);
    }
  }

  // =============================================================
  // Hotspot Profiles Controller Actions
  // =============================================================

  /**
   * GET /api/hotspot/profiles
   */
  static async getAllProfiles(req: Request, res: Response) {
    try {
      const client = await getClientForRequest(req);
      const service = new HotspotService(client);

      const profiles = await service.getAllProfiles();
      return res.status(200).json({
        success: true,
        count: profiles.length,
        data: profiles,
      });
    } catch (err: unknown) {
      return HotspotController.handleError(res, err);
    }
  }

  /**
   * GET /api/hotspot/profiles/:id
   */
  static async getProfileById(req: Request, res: Response) {
    try {
      const client = await getClientForRequest(req);
      const service = new HotspotService(client);

      const profile = await service.getProfileById(req.params.id);
      return res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (err: unknown) {
      return HotspotController.handleError(res, err);
    }
  }

  /**
   * POST /api/hotspot/profiles
   */
  static async createProfile(req: Request, res: Response) {
    try {
      const validated = createHotspotProfileSchema.parse(req.body);
      const client = await getClientForRequest(req);
      const service = new HotspotService(client);

      const profile = await service.createProfile(validated);
      return res.status(201).json({
        success: true,
        message: 'تم إنشاء باقة الهوتسبوت بنجاح',
        data: profile,
      });
    } catch (err: unknown) {
      return HotspotController.handleError(res, err);
    }
  }

  /**
   * PATCH /api/hotspot/profiles/:id
   */
  static async updateProfile(req: Request, res: Response) {
    try {
      const validated = updateHotspotProfileSchema.parse(req.body);
      const client = await getClientForRequest(req);
      const service = new HotspotService(client);

      const profile = await service.updateProfile(req.params.id, validated);
      return res.status(200).json({
        success: true,
        message: 'تم تحديث باقة الهوتسبوت بنجاح',
        data: profile,
      });
    } catch (err: unknown) {
      return HotspotController.handleError(res, err);
    }
  }

  /**
   * DELETE /api/hotspot/profiles/:id
   */
  static async deleteProfile(req: Request, res: Response) {
    try {
      const client = await getClientForRequest(req);
      const service = new HotspotService(client);

      const result = await service.deleteProfile(req.params.id);
      return res.status(200).json({
        success: true,
        message: `تم حذف باقة الهوتسبوت (${req.params.id}) بنجاح`,
        data: result,
      });
    } catch (err: unknown) {
      return HotspotController.handleError(res, err);
    }
  }

  /**
   * Standard error handler
   */
  private static handleError(res: Response, err: unknown) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
    }
    if (err instanceof MikrotikApiError) {
      return res.status(err.statusCode).json({
        success: false,
        error: err.message,
        details: err.details,
      });
    }
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        success: false,
        error: err.message,
      });
    }
    const msg = err instanceof Error ? err.message : 'Internal Server Error';
    return res.status(500).json({
      success: false,
      error: msg,
    });
  }
}
