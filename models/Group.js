import mongoose from 'mongoose'

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    treasurer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cycle: {
      type: String,
      enum: ['Weekly', 'Bi-weekly', 'Monthly'],
      default: 'Monthly',
    },
    interestRate: {
      type: Number,
      default: 10, // percent, chama-configurable
    },
    loanLimitMultiplier: {
      type: Number,
      default: 3, // members can borrow up to 3x their savings
    },
  },
  { timestamps: true }
)

const Group = mongoose.model('Group', groupSchema)

export default Group
