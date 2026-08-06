import express from 'express'
import { recordContribution, getGroupContributions } from '../controllers/contributionController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/', protect, recordContribution)
router.get('/group/:groupId', protect, getGroupContributions)

export default router