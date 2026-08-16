import express from 'express'
import { askAiTreasurer, getWithdrawalRecommendation   } from '../controllers/aiTreasurerController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/ask', protect, askAiTreasurer)
router.post('/withdrawal-recommendation', protect, getWithdrawalRecommendation)


export default router