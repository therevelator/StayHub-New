import express from 'express';
import { generateGuide } from '../controllers/ai.controller.js';

const router = express.Router();

// Public: generate an AI travel guide (itinerary + nearby platform hotels).
router.post('/guide', generateGuide);

export default router;
