import mongoose from 'mongoose'

const loanSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    principal: {
      type: Number,
      required: true,
      min: 1,
    },
    repaid: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'at-risk', 'cleared', 'defaulted'],
      default: 'pending',
    },
    dueDate: {
      type: Date,
    },
  },
  { timestamps: true }
)

const Loan = mongoose.model('Loan', loanSchema)

export default Loan