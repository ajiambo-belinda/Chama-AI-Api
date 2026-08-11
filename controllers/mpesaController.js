import { initiateSTKPush } from '../services/mpesaService.js'
import Contribution from '../models/Contribution.js'
import User from '../models/User.js'

// POST /api/mpesa/stkpush — trigger a payment prompt on the member's phone
export async function triggerSTKPush(req, res) {
  try {
    const { groupId, memberId, amount, phoneNumber } = req.body

    if (!groupId || !memberId || !amount || !phoneNumber) {
      return res.status(400).json({ message: 'Group, member, amount, and phone number are required' })
    }

    // Daraja expects phone numbers in 254XXXXXXXXX format, no leading 0 or +
    let formattedPhone = phoneNumber.replace(/\D/g, '')
    if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.slice(1)
    if (formattedPhone.startsWith('7') || formattedPhone.startsWith('1')) formattedPhone = '254' + formattedPhone

    const stkResponse = await initiateSTKPush({
      phoneNumber: formattedPhone,
      amount,
      accountReference: 'ChamaAI',
      transactionDesc: 'Chama contribution',
    })

    // Create a pending contribution now, linked to this STK push, so we can match the callback later
    const contribution = await Contribution.create({
      group: groupId,
      member: memberId,
      amount,
      method: 'M-Pesa',
      status: 'pending',
      recordedBy: 'self',
      checkoutRequestId: stkResponse.CheckoutRequestID,
    })

    res.status(201).json({
      message: 'STK push sent. Check your phone to complete payment.',
      checkoutRequestId: stkResponse.CheckoutRequestID,
      contributionId: contribution._id,
    })
  } catch (error) {
    console.error('STK Push error:', error.response?.data || error.message)
    res.status(500).json({ message: 'Failed to initiate M-Pesa payment', details: error.response?.data })
  }
}

// POST /api/mpesa/callback — Safaricom calls this automatically once the payment completes
export async function handleMpesaCallback(req, res) {
  try {
    const callback = req.body?.Body?.stkCallback
    if (!callback) return res.status(400).json({ message: 'Invalid callback payload' })

    const { CheckoutRequestID, ResultCode, CallbackMetadata } = callback

    const contribution = await Contribution.findOne({ checkoutRequestId: CheckoutRequestID })
    if (!contribution) {
      // Still acknowledge receipt to Safaricom even if we can't match it, per their integration requirements
      return res.status(200).json({ message: 'Received' })
    }

    if (ResultCode === 0) {
      // Payment succeeded — extract the M-Pesa receipt number from the metadata array
      const items = CallbackMetadata?.Item || []
      const receipt = items.find((i) => i.Name === 'MpesaReceiptNumber')?.Value

      contribution.status = 'confirmed'
      contribution.mpesaReceiptNumber = receipt || 'N/A'
      await contribution.save()

      // Now actually credit the member's savings, since the payment is confirmed
      await User.findByIdAndUpdate(contribution.member, { $inc: { savings: contribution.amount } })
    } else {
      // Payment failed, was cancelled, or timed out
      contribution.status = 'flagged'
      await contribution.save()
    }

    res.status(200).json({ message: 'Callback processed' })
  } catch (error) {
    console.error('Callback error:', error.message)
    res.status(200).json({ message: 'Received' }) // always acknowledge, even on internal error
  }
}