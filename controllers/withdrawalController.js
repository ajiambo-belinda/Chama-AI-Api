import Withdrawal from '../models/Withdrawal.js'
import Loan from '../models/Loan.js'
import User from '../models/User.js'
import Group from '../models/Group.js'

// POST /api/withdrawals — request a withdrawal
export async function requestWithdrawal(req, res) {
  try {
    const { groupId, amount } = req.body
    const memberId = req.user._id

    if (!groupId || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Group and a valid amount are required' })
    }

    const member = await User.findById(memberId)
    if (amount > member.savings) {
      return res.status(400).json({ message: `Amount exceeds your available savings of KES ${member.savings.toLocaleString()}.` })
    }

    const activeLoan = await Loan.findOne({
      member: memberId,
      group: groupId,
      status: { $in: ['active', 'at-risk', 'pending'] },
    })
    if (activeLoan) {
      return res.status(400).json({ message: 'Withdrawals are locked while you have an outstanding loan.' })
    }

    const withdrawal = await Withdrawal.create({
      group: groupId,
      member: memberId,
      amount,
      status: 'pending',
    })

    res.status(201).json(withdrawal)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// PUT /api/withdrawals/:id/approve — treasurer approves, money actually leaves savings now
export async function approveWithdrawal(req, res) {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id).populate('group')
    if (!withdrawal) return res.status(404).json({ message: 'Withdrawal not found' })

    if (withdrawal.group.treasurer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the treasurer can approve withdrawals' })
    }
    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ message: 'This withdrawal has already been processed' })
    }

    const member = await User.findById(withdrawal.member)
    if (withdrawal.amount > member.savings) {
      return res.status(400).json({ message: 'Member no longer has sufficient savings for this withdrawal' })
    }

    member.savings -= withdrawal.amount
    await member.save()

    withdrawal.status = 'approved'
    withdrawal.approvedBy = req.user._id
    await withdrawal.save()

    res.json(withdrawal)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// PUT /api/withdrawals/:id/reject — treasurer rejects, nothing changes financially
export async function rejectWithdrawal(req, res) {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id).populate('group')
    if (!withdrawal) return res.status(404).json({ message: 'Withdrawal not found' })

    if (withdrawal.group.treasurer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the treasurer can reject withdrawals' })
    }
    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ message: 'This withdrawal has already been processed' })
    }

    withdrawal.status = 'rejected'
    withdrawal.approvedBy = req.user._id
    await withdrawal.save()

    res.json(withdrawal)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// GET /api/withdrawals/group/:groupId — all withdrawals for a group
export async function getGroupWithdrawals(req, res) {
  try {
    const withdrawals = await Withdrawal.find({ group: req.params.groupId })
      .populate('member', 'name email')
      .sort({ createdAt: -1 })

    res.json(withdrawals)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}