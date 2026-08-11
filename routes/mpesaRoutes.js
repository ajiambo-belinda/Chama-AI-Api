import express from 'express'
import { triggerSTKPush, handleMpesaCallback } from '../controllers/mpesaController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/stkpush', protect, triggerSTKPush)
router.post('/callback', handleMpesaCallback) // NOT protected — Safaricom's servers call this directly, no user token

export default router