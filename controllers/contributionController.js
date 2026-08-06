import Contribution from '../models/Contribution.js'
import User from '../models/User.js'

// POST /api/contributions — record a new contribution
export async function recordContribution(req, res) {
  try {
    const { groupId, memberId, amount, method, recordedBy } = req.body

    if (!groupId || !memberId || !amount) {
      return res.status(400).json({ message: 'Group, member, and amount are required' })
    }

    const status = method === 'M-Pesa' ? 'pending' : 'confirmed'

    const contribution = await Contribution.create({
      group: groupId,
      member: memberId,
      amount,
      method: method || 'Cash',
      status,
      recordedBy: recordedBy || 'self',
    })

    // Only confirmed contributions immediately count toward savings —
    // M-Pesa entries wait until reconciliation (that comes with the Daraja integration)
    if (status === 'confirmed') {
      await User.findByIdAndUpdate(memberId, { $inc: { savings: amount } })
    }

    const populated = await contribution.populate('member', 'name email savings')
    res.status(201).json(populated)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// GET /api/contributions/group/:groupId — all contributions for a group
export async function getGroupContributions(req, res) {
  try {
    const contributions = await Contribution.find({ group: req.params.groupId })
      .populate('member', 'name email')
      .sort({ createdAt: -1 })

    res.json(contributions)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}