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
      officials: { treasurer: req.user._id },
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
      .populate('members', 'name email savings banned')
      .populate('treasurer', 'name email')
      .populate('officials.chairman', 'name email')
      .populate('officials.secretary', 'name email')
      .populate('officials.treasurer', 'name email')

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
      .populate('officials.chairman', 'name email')
      .populate('officials.secretary', 'name email')
      .populate('officials.treasurer', 'name email')

    if (!group) {
      return res.status(404).json({ message: 'Group not found' })
    }

    res.json(group)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// PUT /api/groups/:id — update group settings (treasurer only)
export async function updateGroup(req, res) {
  try {
    const group = await Group.findById(req.params.id)
    if (!group) return res.status(404).json({ message: 'Group not found' })

    if (group.treasurer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the treasurer can update group settings' })
    }

    const { cycle, interestRate, loanLimitMultiplier } = req.body

    if (cycle !== undefined) group.cycle = cycle
    if (interestRate !== undefined) group.interestRate = interestRate
    if (loanLimitMultiplier !== undefined) group.loanLimitMultiplier = loanLimitMultiplier

    await group.save()

    const populated = await group.populate('members', 'name email savings banned')
    res.json(populated)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// PUT /api/groups/:id/officials — assign chairman/secretary/treasurer (treasurer only)
export async function assignOfficials(req, res) {
  try {
    const group = await Group.findById(req.params.id)
    if (!group) return res.status(404).json({ message: 'Group not found' })

    if (group.treasurer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the treasurer can assign roles' })
    }

    const { chairman, secretary, treasurer } = req.body

    for (const id of [chairman, secretary, treasurer].filter(Boolean)) {
      if (!group.members.map((m) => m.toString()).includes(id)) {
        return res.status(400).json({ message: 'Assigned official must be a member of the group' })
      }
    }

    if (chairman !== undefined) group.officials.chairman = chairman || undefined
    if (secretary !== undefined) group.officials.secretary = secretary || undefined
    if (treasurer !== undefined) group.officials.treasurer = treasurer || undefined

    await group.save()
    const populated = await group.populate([
      { path: 'members', select: 'name email savings banned' },
      { path: 'officials.chairman', select: 'name email' },
      { path: 'officials.secretary', select: 'name email' },
      { path: 'officials.treasurer', select: 'name email' },
    ])

    res.json(populated)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}