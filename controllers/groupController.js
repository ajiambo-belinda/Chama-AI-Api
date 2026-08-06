import Group from '../models/Group.js'

// POST /api/groups — create a new group
export async function createGroup(req, res) {
  try {
    const { name, memberIds, cycle } = req.body

    if (!name || !memberIds || memberIds.length === 0) {
      return res.status(400).json({ message: 'Group name and at least one member are required' })
    }

    const group = await Group.create({
      name,
      members: memberIds,
      treasurer: req.user._id,
      cycle: cycle || 'Monthly',
    })

    const populatedGroup = await group.populate('members', 'name email savings')

    res.status(201).json(populatedGroup)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// GET /api/groups — get every group the logged-in user belongs to
export async function getMyGroups(req, res) {
  try {
    const groups = await Group.find({ members: req.user._id })
      .populate('members', 'name email savings')
      .populate('treasurer', 'name email')

    res.json(groups)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// GET /api/groups/:id — get one specific group's full details
export async function getGroupById(req, res) {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members', 'name email savings banned')
      .populate('treasurer', 'name email')

    if (!group) {
      return res.status(404).json({ message: 'Group not found' })
    }

    res.json(group)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}