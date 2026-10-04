// src/models/Category.js
import mongoose from 'mongoose'

const categorySchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      unique: true,
      trim: true
    },
    descripcion: {
      type: String,
      default: '',
      trim: true
    },
    activo: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
)

export default mongoose.model('Category', categorySchema)
