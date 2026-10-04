// src/controllers/user.controller.js
import User from '../models/User.js'

// GET /api/users
export const listarUsuarios = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 })
    res.json(users)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// POST /api/users
export const crearUsuario = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body

    if (!nombre || !email || !password) {
      return res.status(400).json({ message: 'Faltan campos' })
    }

    const existe = await User.findOne({ email })
    if (existe) {
      return res.status(400).json({ message: 'Email ya registrado' })
    }

    const passwordHash = await User.hashPassword(password)

    const user = await User.create({
      nombre,
      email,
      passwordHash,
      rol: rol || 'cajero'
    })

    res.status(201).json(user)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// PUT /api/users/:id
export const actualizarUsuario = async (req, res) => {
  try {
    const { nombre, email, rol, activo, password } = req.body

    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' })

    if (nombre) user.nombre = nombre
    if (email) user.email = email
    if (rol) user.rol = rol
    if (typeof activo === 'boolean') user.activo = activo

    if (password) {
      user.passwordHash = await User.hashPassword(password)
    }

    await user.save()
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// DELETE /api/users/:id
export const eliminarUsuario = async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'No puedes eliminarte a ti mismo' })
    }

    await User.findByIdAndDelete(req.params.id)
    res.json({ message: 'Usuario eliminado' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
