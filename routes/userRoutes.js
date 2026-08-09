import express from 'express'
import { lookupUserByEmail } from '../controllers/userController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/lookup', protect, lookupUserByEmail)

export default router