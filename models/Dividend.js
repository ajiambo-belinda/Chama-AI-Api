import mongoose from 'mongoose'

const dividendSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    totalProfit: {
      type: Number,
      required: true,
    },
    breakdown: [
      {
        member: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        savingsAtDistribution: Number,
        amount: Number,
      },
    ],
    period: {
      type: String, // e.g. "2026" or "Q1 2026"
      required: true,
    },
  },
  { timestamps: true }
)

const Dividend = mongoose.model('Dividend', dividendSchema)

export default Dividend
