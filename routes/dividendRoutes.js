import express from 'express'
import { previewDividend, declareDividend, getDividendHistory } from '../controllers/dividendController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/group/:groupId/preview', protect, previewDividend)
router.post('/group/:groupId/declare', protect, declareDividend)
router.get('/group/:groupId', protect, getDividendHistory)

export default router