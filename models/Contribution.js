import mongoose from 'mongoose'

const contributionSchema = new mongoose.Schema(
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
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    method: {
      type: String,
      enum: ['Cash', 'M-Pesa', 'Bank'],
      default: 'Cash',
    },
    status: {
      type: String,
      enum: ['confirmed', 'pending', 'flagged'],
      default: 'confirmed',
    },
    recordedBy: {
      type: String,
      enum: ['self', 'treasurer'],
      default: 'self',
    },
    checkoutRequestId: {
      type: String,
    },
    mpesaReceiptNumber: {
      type: String,
    },
  },
  { timestamps: true }
)

const Contribution = mongoose.model('Contribution', contributionSchema)

export default Contribution