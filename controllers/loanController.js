import Loan from '../models/Loan.js'
import Group from '../models/Group.js'
import User from '../models/User.js'

// POST /api/loans — request a new loan
export async function requestLoan(req, res) {
  try {
    const { groupId, amount } = req.body
    const memberId = req.user._id

    const group = await Group.findById(groupId)
    if (!group) return res.status(404).json({ message: 'Group not found' })

    const member = await User.findById(memberId)
    if (member.banned) {
      return res.status(400).json({ message: 'You are banned from borrowing due to a prior default.' })
    }

    const existingLoan = await Loan.findOne({
      member: memberId,
      group: groupId,
      status: { $in: ['pending', 'active', 'at-risk'] },
    })
    if (existingLoan) {
      return res.status(400).json({ message: 'You must clear your current loan before requesting a new one.' })
    }

    const eligibleLimit = member.savings * group.loanLimitMultiplier
    if (amount > eligibleLimit) {
      return res.status(400).json({
        message: `Amount exceeds your eligible limit of KES ${eligibleLimit.toLocaleString()}.`,
      })
    }

    const loan = await Loan.create({
      group: groupId,
      member: memberId,
      principal: amount,
      status: 'pending',
    })

    res.status(201).json(loan)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// PUT /api/loans/:id/repay — repay any amount toward a loan
export async function repayLoan(req, res) {
  try {
    const { amount } = req.body
    const loan = await Loan.findById(req.params.id).populate('group')

    if (!loan) return res.status(404).json({ message: 'Loan not found' })

    const totalOwed = loan.principal * (1 + loan.group.interestRate / 100)
    loan.repaid = Math.min(loan.repaid + amount, totalOwed)

    if (loan.repaid >= totalOwed) {
      loan.status = 'cleared'
    }

    await loan.save()
    res.json(loan)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// PUT /api/loans/:id/default — mark a loan as defaulted (treasurer action)
export async function markDefaulted(req, res) {
  try {
    const loan = await Loan.findById(req.params.id).populate('group')
    if (!loan) return res.status(404).json({ message: 'Loan not found' })

    const totalOwed = loan.principal * (1 + loan.group.interestRate / 100)
    const balanceRemaining = Math.max(totalOwed - loan.repaid, 0)

    const member = await User.findById(loan.member)
    const deducted = Math.min(member.savings, balanceRemaining)

    member.savings -= deducted
    member.banned = true
    await member.save()

    loan.status = 'defaulted'
    loan.repaid += deducted
    await loan.save()

    res.json({ loan, deductedFromSavings: deducted })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// GET /api/loans/group/:groupId — all loans for a group
export async function getGroupLoans(req, res) {
  try {
    const loans = await Loan.find({ group: req.params.groupId })
      .populate('member', 'name email savings banned')
      .sort({ createdAt: -1 })

    res.json(loans)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}