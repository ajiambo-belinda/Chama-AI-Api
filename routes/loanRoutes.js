import express from 'express'
import { requestLoan, repayLoan, markDefaulted, getGroupLoans } from '../controllers/loanController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/', protect, requestLoan)
router.put('/:id/repay', protect, repayLoan)
router.put('/:id/default', protect, markDefaulted)
router.get('/group/:groupId', protect, getGroupLoans)

export default router