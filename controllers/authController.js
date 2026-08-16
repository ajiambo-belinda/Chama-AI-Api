import User from '../models/User.js'
import { generateToken } from '../utils/generateToken.js'

// POST /api/auth/register
export async function registerUser(req, res) {
  try {
    const { name, email, phone, password } = req.body

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'Please fill in all fields' })
    }

    const userExists = await User.findOne({ email })
    if (userExists) {
      return res.status(400).json({ message: 'An account with this email already exists' })
    }

    const user = await User.create({ name, email, phone, password })

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      savings: user.savings,
      token: generateToken(user._id),
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// POST /api/auth/login
export async function loginUser(req, res) {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        savings: user.savings,
        token: generateToken(user._id),
      })
    } else {
      res.status(401).json({ message: 'Invalid email or password' })
    }
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// PUT /api/auth/change-password
export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' })
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' })
    }

    const user = await User.findById(req.user._id)
    const isMatch = await user.matchPassword(currentPassword)

    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' })
    }

    user.password = newPassword // pre-save hook will hash it automatically
    await user.save()

    res.json({ message: 'Password updated successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}