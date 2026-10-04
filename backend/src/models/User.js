// src/models/User.js
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'El email es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    rol: {
      type: String,
      enum: ['admin', 'cajero'],
      default: 'cajero'
    },
    activo: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
)

// Método para comparar contraseñas
userSchema.methods.compararPassword = async function (passwordPlano) {
  return await bcrypt.compare(passwordPlano, this.passwordHash)
}

// Método estático para hashear antes de guardar
userSchema.statics.hashPassword = async function (passwordPlano) {
  const salt = await bcrypt.genSalt(10)
  return await bcrypt.hash(passwordPlano, salt)
}

// Ocultar el hash al devolver el usuario en JSON
userSchema.methods.toJSON = function () {
  const user = this.toObject()
  delete user.passwordHash
  return user
}

export default mongoose.model('User', userSchema)
