import Dividend from '../models/Dividend.js'
import Loan from '../models/Loan.js'
import Group from '../models/Group.js'
import User from '../models/User.js'

// GET /api/dividends/group/:groupId/preview — calculate what a dividend WOULD look like, without distributing yet
export async function previewDividend(req, res) {
  try {
    const group = await Group.findById(req.params.groupId).populate('members', 'name savings')
    if (!group) return res.status(404).json({ message: 'Group not found' })

    const loans = await Loan.find({ group: group._id })

    // Interest earned per loan = whatever's been repaid beyond the original principal
    const totalProfit = loans.reduce((sum, loan) => {
      const interestPortion = Math.max(0, loan.repaid - loan.principal)
      return sum + interestPortion
    }, 0)

    const totalSavings = group.members.reduce((sum, m) => sum + m.savings, 0)

    const breakdown = group.members.map((m) => ({
      member: m._id,
      name: m.name,
      savingsAtDistribution: m.savings,
      amount: totalSavings > 0 ? Math.round((m.savings / totalSavings) * totalProfit) : 0,
    }))

    res.json({ totalProfit, totalSavings, breakdown })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// POST /api/dividends/group/:groupId/declare — actually distribute and credit member savings
export async function declareDividend(req, res) {
  try {
    const { period } = req.body
    const group = await Group.findById(req.params.groupId).populate('members', 'name savings')
    if (!group) return res.status(404).json({ message: 'Group not found' })

    const loans = await Loan.find({ group: group._id })
    const totalProfit = loans.reduce((sum, loan) => {
      const interestPortion = Math.max(0, loan.repaid - loan.principal)
      return sum + interestPortion
    }, 0)

    if (totalProfit <= 0) {
      return res.status(400).json({ message: 'No profit available to distribute yet.' })
    }

    const totalSavings = group.members.reduce((sum, m) => sum + m.savings, 0)

    const breakdown = []
    for (const member of group.members) {
      const amount = totalSavings > 0 ? Math.round((member.savings / totalSavings) * totalProfit) : 0
      if (amount > 0) {
        await User.findByIdAndUpdate(member._id, { $inc: { savings: amount } })
      }
      breakdown.push({ member: member._id, savingsAtDistribution: member.savings, amount })
    }

    const dividend = await Dividend.create({
      group: group._id,
      totalProfit,
      breakdown,
      period: period || new Date().getFullYear().toString(),
    })

    res.status(201).json(dividend)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// GET /api/dividends/group/:groupId — dividend history for a group
export async function getDividendHistory(req, res) {
  try {
    const dividends = await Dividend.find({ group: req.params.groupId })
      .populate('breakdown.member', 'name email')
      .sort({ createdAt: -1 })

    res.json(dividends)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}