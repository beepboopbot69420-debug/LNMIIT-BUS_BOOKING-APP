import express from 'express';
import {
  getAllBuses,
  getBusById,
  createBus,
  updateBus,
  deleteBus,
} from '../controllers/busController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Student routes
router.route('/').get(protect, getAllBuses);
router.route('/:id').get(protect, getBusById);

// Admin routes
router.route('/').post(protect, admin, createBus);
router.route('/:id').put(protect, admin, updateBus).delete(protect, admin, deleteBus);

export default router;