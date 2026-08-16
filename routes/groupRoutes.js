import express from 'express'
import { createGroup, getMyGroups, getGroupById, updateGroup, assignOfficials, addGroupMember, removeGroupMember } from '../controllers/groupController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/', protect, createGroup)
router.get('/', protect, getMyGroups)
router.get('/:id', protect, getGroupById)
router.put('/:id', protect, updateGroup)
router.put('/:id/officials', protect, assignOfficials)
router.post('/:id/members', protect, addGroupMember)
router.delete('/:id/members/:memberId', protect, removeGroupMember)

export default router