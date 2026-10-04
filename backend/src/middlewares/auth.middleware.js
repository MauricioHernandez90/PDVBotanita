// src/middlewares/auth.middleware.js
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

// Verifica el token JWT
export const proteger = async (req, res, next) => {
  try {
    let token

    // Buscar el token en el header Authorization: Bearer xxx
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
      return res.status(401).json({ message: 'No autorizado, falta token' })
    }

    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Buscar el usuario
    const user = await User.findById(decoded.id)
    if (!user || !user.activo) {
      return res.status(401).json({ message: 'Usuario no válido o inactivo' })
    }

    req.user = user
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado' })
  }
}

// Verifica que el usuario sea admin
export const soloAdmin = (req, res, next) => {
  if (req.user && req.user.rol === 'admin') {
    next()
  } else {
    res.status(403).json({ message: 'Acceso denegado, se requiere rol admin' })
  }
}
