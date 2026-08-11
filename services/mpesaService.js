import axios from 'axios'

const BASE_URL = 'https://sandbox.safaricom.co.ke'

// Get a fresh OAuth token — required before any other Daraja API call
export async function getAccessToken() {
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString('base64')

  const { data } = await axios.get(
    `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${auth}` } }
  )

  return data.access_token
}

// Generate the timestamp Daraja expects: YYYYMMDDHHmmss
function getTimestamp() {
  const now = new Date()
  const pad = (n) => n.toString().padStart(2, '0')
  return (
    now.getFullYear().toString() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds())
  )
}

// Trigger an STK Push — the "enter your PIN" prompt on the member's phone
export async function initiateSTKPush({ phoneNumber, amount, accountReference, transactionDesc }) {
  const accessToken = await getAccessToken()
  const timestamp = getTimestamp()

  const password = Buffer.from(
    `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
  ).toString('base64')

  const payload = {
    BusinessShortCode: process.env.MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.round(amount),
    PartyA: phoneNumber,
    PartyB: process.env.MPESA_SHORTCODE,
    PhoneNumber: phoneNumber,
    CallBackURL: process.env.MPESA_CALLBACK_URL,
    AccountReference: accountReference || 'ChamaAI',
    TransactionDesc: transactionDesc || 'Chama contribution',
  }

  const { data } = await axios.post(
    `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
    payload,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  return data
}