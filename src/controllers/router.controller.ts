import { Request, Response } from 'express';
import { z } from 'zod';
import { RouterService } from '../services/RouterService';
import { AppError, MikrotikApiError } from '../utils/errors';

export const newRouterSchema = z.object({
  name: z.string().min(1, 'اسم الراوتر مطلوب'),
  host: z.string().min(1, 'عنوان المضيف أو الآي بي مطلوب (Host/IP)'),
  port: z.number().int().min(1).max(65535).optional(),
  username: z.string().min(1, 'اسم المستخدم مطلوب'),
  password: z.string().min(0).default(''),
  ssl: z.boolean().optional().default(false),
  testFirst: z.boolean().optional().default(false),
});

export class RouterController {
  private static service = RouterService.getInstance();

  /**
   * GET /api/routers
   */
  static async getAll(_req: Request, res: Response) {
    try {
      const routers = await RouterController.service.getAll();
      return res.status(200).json({
        success: true,
        count: routers.length,
        data: routers,
      });
    } catch (err: unknown) {
      return RouterController.handleError(res, err);
    }
  }

  /**
   * POST /api/routers
   */
  static async create(req: Request, res: Response) {
    try {
      const validated = newRouterSchema.parse(req.body);
      const created = await RouterController.service.addRouter(validated, validated.testFirst);

      return res.status(201).json({
        success: true,
        message: 'تمت إضافة الراوتر وحفظه بنجاح',
        data: created,
      });
    } catch (err: unknown) {
      return RouterController.handleError(res, err);
    }
  }

  /**
   * DELETE /api/routers/:id
   */
  static async delete(req: Request, res: Response) {
    try {
      const result = await RouterController.service.deleteRouter(req.params.id);
      return res.status(200).json({
        success: true,
        message: 'تم حذف الراوتر بنجاح',
        data: result,
      });
    } catch (err: unknown) {
      return RouterController.handleError(res, err);
    }
  }

  /**
   * GET /api/routers/:id/status
   */
  static async checkStatus(req: Request, res: Response) {
    try {
      const status = await RouterController.service.checkStatus(req.params.id);
      return res.status(200).json({
        success: true,
        data: status,
      });
    } catch (err: unknown) {
      return RouterController.handleError(res, err);
    }
  }

  private static handleError(res: Response, err: unknown) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
    }
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        success: false,
        error: err.message,
      });
    }
    if (err instanceof MikrotikApiError) {
      return res.status(err.statusCode).json({
        success: false,
        error: err.message,
        details: err.details,
      });
    }
    const msg = err instanceof Error ? err.message : 'Internal Server Error';
    return res.status(500).json({
      success: false,
      error: msg,
    });
  }
}
