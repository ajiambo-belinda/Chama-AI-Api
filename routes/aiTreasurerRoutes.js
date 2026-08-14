import express from 'express'
import { askAiTreasurer } from '../controllers/aiTreasurerController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/ask', protect, askAiTreasurer)

export default router