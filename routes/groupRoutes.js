import express from 'express'
import { createGroup, getMyGroups, getGroupById } from '../controllers/groupController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/', protect, createGroup)
router.get('/', protect, getMyGroups)
router.get('/:id', protect, getGroupById)

export default router