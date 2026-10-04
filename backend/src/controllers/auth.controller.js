// src/controllers/auth.controller.js
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

// Genera un JWT con el id y rol del usuario
const generarToken = (user) => {
  return jwt.sign(
    { id: user._id, rol: user.rol },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body

    // Validación básica
    if (!nombre || !email || !password) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' })
    }

    // Verificar que no exista
    const existe = await User.findOne({ email })
    if (existe) {
      return res.status(400).json({ message: 'El email ya está registrado' })
    }

    // Hashear contraseña
    const passwordHash = await User.hashPassword(password)

    // Crear usuario. Solo permitimos crear admin si no existe ninguno.
    const totalUsuarios = await User.countDocuments()
    const rolFinal = totalUsuarios === 0 ? 'admin' : (rol === 'admin' ? 'cajero' : 'cajero')

    const user = await User.create({
      nombre,
      email,
      passwordHash,
      rol: rolFinal
    })

    res.status(201).json({
      message: 'Usuario registrado',
      user,
      token: generarToken(user)
    })
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: error.message })
  }
}

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña obligatorios' })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' })
    }

    if (!user.activo) {
      return res.status(403).json({ message: 'Usuario desactivado' })
    }

    const valido = await user.compararPassword(password)
    if (!valido) {
      return res.status(401).json({ message: 'Credenciales inválidas' })
    }

    res.json({
      message: 'Login exitoso',
      user,
      token: generarToken(user)
    })
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: error.message })
  }
}

// GET /api/auth/me  (requiere token)
export const me = async (req, res) => {
  res.json({ user: req.user })
}
