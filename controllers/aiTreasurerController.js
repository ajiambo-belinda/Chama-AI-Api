import { askGemini } from '../services/geminiService.js'
import Group from '../models/Group.js'
import Loan from '../models/Loan.js'
import Contribution from '../models/Contribution.js'

// POST /api/ai-treasurer/ask — answer a free-form question using real group data
export async function askAiTreasurer(req, res) {
  try {
    const { groupId, question } = req.body

    if (!groupId || !question) {
      return res.status(400).json({ message: 'Group and question are required' })
    }

    const group = await Group.findById(groupId).populate('members', 'name savings banned')
    if (!group) return res.status(404).json({ message: 'Group not found' })

    const loans = await Loan.find({ group: groupId }).populate('member', 'name')
    const contributions = await Contribution.find({ group: groupId })
      .populate('member', 'name')
      .sort({ createdAt: -1 })
      .limit(20)

    // Build a compact, factual summary of the group's real state for the model to reason over
    const context = `
Group: ${group.name}
Cycle: ${group.cycle}
Interest rate: ${group.interestRate}%
Loan limit multiplier: ${group.loanLimitMultiplier}x savings

Members:
${group.members.map((m) => `- ${m.name}: KES ${m.savings.toLocaleString()} saved${m.banned ? ' (BANNED from borrowing)' : ''}`).join('\n')}

Loans:
${loans.length === 0 ? 'No loans recorded.' : loans.map((l) => `- ${l.member.name}: KES ${l.principal.toLocaleString()} principal, KES ${l.repaid.toLocaleString()} repaid, status: ${l.status}`).join('\n')}

Recent contributions (most recent first):
${contributions.length === 0 ? 'None recorded.' : contributions.map((c) => `- ${c.member.name}: KES ${c.amount.toLocaleString()} via ${c.method}, status: ${c.status}`).join('\n')}
`.trim()

    const prompt = `You are the AI Treasurer for a Kenyan chama (savings group) called "${group.name}". You have access to the group's real financial data below. Answer the treasurer's question clearly and concisely, using only the data provided. If the data doesn't contain enough information to answer, say so honestly rather than guessing.

GROUP DATA:
${context}

QUESTION: ${question}`

    const answer = await askGemini(prompt)

    res.json({ answer })
  } catch (error) {
    console.error('AI Treasurer error:', error.response?.data || error.message)
    res.status(500).json({ message: 'Failed to get AI response', details: error.response?.data })
  }
}