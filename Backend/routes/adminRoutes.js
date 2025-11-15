import express from 'express';
import { getDashboardStats, downloadReport } from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/stats', protect, admin, getDashboardStats);
router.get('/report', protect, admin, downloadReport);

export default router;