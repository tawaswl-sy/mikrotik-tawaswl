import { Request, Response } from 'express';
import { z } from 'zod';
import { BatchService } from '../services/BatchService';
import { AppError, MikrotikApiError } from '../utils/errors';

export const generateBatchSchema = z.object({
  name: z.string().optional(),
  routerId: z.string().optional(),
  profile: z.string().min(1, 'Hotspot profile name is required'),
  quantity: z.number().int().min(1).max(500).default(10),
  price: z.string().optional(),
  reseller: z.string().optional(),
  prefix: z.string().optional(),
  codeLength: z.number().int().min(4).max(16).optional(),
  characterSet: z.enum(['numeric', 'alphanumeric', 'uppercase', 'easy-read']).optional(),
  accountMode: z.enum(['user_pass', 'user_equals_pass', 'pin_only']).optional(),
  timeLimit: z.string().optional(),
  dataLimitMB: z.number().optional(),
  syncToRouter: z.boolean().optional().default(false),
});

export class BatchController {
  private static service = BatchService.getInstance();

  /**
   * POST /api/hotspot/batches/generate
   */
  static async generate(req: Request, res: Response) {
    try {
      const validated = generateBatchSchema.parse(req.body);
      const batch = await BatchController.service.generateBatch(validated);

      return res.status(201).json({
        success: true,
        message: `تم توليد دفعة الكروت (${batch.name}) بنجاح بواقع ${batch.quantity} كرت`,
        data: batch,
      });
    } catch (err: unknown) {
      return BatchController.handleError(res, err);
    }
  }

  /**
   * GET /api/hotspot/batches
   */
  static async getAll(_req: Request, res: Response) {
    try {
      const batches = await BatchController.service.getAllBatches();
      return res.status(200).json({
        success: true,
        count: batches.length,
        data: batches,
      });
    } catch (err: unknown) {
      return BatchController.handleError(res, err);
    }
  }

  /**
   * GET /api/hotspot/batches/:id
   */
  static async getById(req: Request, res: Response) {
    try {
      const batch = await BatchController.service.getBatchById(req.params.id);
      return res.status(200).json({
        success: true,
        data: batch,
      });
    } catch (err: unknown) {
      return BatchController.handleError(res, err);
    }
  }

  /**
   * POST /api/hotspot/batches/:id/sync
   */
  static async syncToRouter(req: Request, res: Response) {
    try {
      const result = await BatchController.service.syncBatchToRouter(req.params.id);
      return res.status(200).json({
        success: true,
        message: `تمت مزامنة ${result.syncedCount} كرت بنجاح مع راوتر الميكروتك`,
        data: result,
      });
    } catch (err: unknown) {
      return BatchController.handleError(res, err);
    }
  }

  /**
   * DELETE /api/hotspot/batches/:id
   */
  static async delete(req: Request, res: Response) {
    try {
      const deleteFromRouter = req.query.deleteFromRouter === 'true' || req.body?.deleteFromRouter === true;
      const result = await BatchController.service.deleteBatch(req.params.id, deleteFromRouter);

      return res.status(200).json({
        success: true,
        message: 'تم حذف الدفعة بنجاح' + (result.deletedFromRouter ? ' وحذف بطاقاتها من راوتر الميكروتك' : ''),
        data: result,
      });
    } catch (err: unknown) {
      return BatchController.handleError(res, err);
    }
  }

  /**
   * GET /api/hotspot/batches/:id/export
   */
  static async export(req: Request, res: Response) {
    try {
      const format = (req.query.format as string) || 'csv';
      const host = (req.query.host as string) || '10.0.0.1/login';

      if (format === 'json') {
        const batch = await BatchController.service.getBatchById(req.params.id);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${batch.id}.json"`);
        return res.send(JSON.stringify(batch, null, 2));
      }

      const csvContent = await BatchController.service.exportBatchCsv(req.params.id, host);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="batch_${req.params.id}.csv"`);
      return res.send(csvContent);
    } catch (err: unknown) {
      return BatchController.handleError(res, err);
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
