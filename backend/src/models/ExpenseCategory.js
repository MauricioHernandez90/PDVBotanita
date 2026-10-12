// src/models/ExpenseCategory.js
import mongoose from 'mongoose'

const expenseCategorySchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    tipo: {
      type: String,
      enum: ['fijo', 'variable'],
      required: true
    },
    descripcion: {
      type: String,
      default: ''
    },
    activo: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
)

export default mongoose.model('ExpenseCategory', expenseCategorySchema)
