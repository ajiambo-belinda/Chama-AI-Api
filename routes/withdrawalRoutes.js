import express from 'express'
import { requestWithdrawal, approveWithdrawal, rejectWithdrawal, getGroupWithdrawals } from '../controllers/withdrawalController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/', protect, requestWithdrawal)
router.put('/:id/approve', protect, approveWithdrawal)
router.put('/:id/reject', protect, rejectWithdrawal)
router.get('/group/:groupId', protect, getGroupWithdrawals)

export default router