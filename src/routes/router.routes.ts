import { Router } from 'express';
import { RouterController } from '../controllers/router.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Secure router management routes with JWT auth
router.use(authMiddleware);

router.get('/', RouterController.getAll);
router.post('/', RouterController.create);
router.delete('/:id', RouterController.delete);
router.get('/:id/status', RouterController.checkStatus);

export default router;
