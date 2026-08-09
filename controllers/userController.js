import User from '../models/User.js'

// GET /api/users/lookup?email=someone@example.com
export async function lookupUserByEmail(req, res) {
  try {
    const { email } = req.query
    if (!email) return res.status(400).json({ message: 'Email is required' })

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('name email savings')

    if (!user) {
      return res.status(404).json({ message: 'No registered member found with that email' })
    }

    res.json(user)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}