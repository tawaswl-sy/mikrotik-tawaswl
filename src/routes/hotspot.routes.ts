import { Router } from 'express';
import { HotspotController } from '../controllers/hotspot.controller';
import { BatchController } from '../controllers/batch.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Apply JWT authentication to all hotspot routes
router.use(authMiddleware);

// Hotspot Batches & Vouchers Endpoints
router.post('/batches/generate', BatchController.generate);
router.get('/batches', BatchController.getAll);
router.get('/batches/:id', BatchController.getById);
router.get('/batches/:id/export', BatchController.export);
router.post('/batches/:id/sync', BatchController.syncToRouter);
router.delete('/batches/:id', BatchController.delete);

// Hotspot Users Endpoints
router.get('/users', HotspotController.getAll);
router.get('/users/:id', HotspotController.getById);
router.post('/users', HotspotController.create);
router.patch('/users/:id', HotspotController.update);
router.delete('/users/:id', HotspotController.delete);
router.post('/users/bulk-delete', HotspotController.bulkDelete);
router.post('/users/bulk-create', HotspotController.bulkCreate);

// Active Sessions Endpoints
router.get('/active', HotspotController.getActive);
router.delete('/active/:id', HotspotController.kickActive);

// Hotspot Profiles Endpoints
router.get('/profiles', HotspotController.getAllProfiles);
router.get('/profiles/:id', HotspotController.getProfileById);
router.post('/profiles', HotspotController.createProfile);
router.patch('/profiles/:id', HotspotController.updateProfile);
router.delete('/profiles/:id', HotspotController.deleteProfile);

export default router;
