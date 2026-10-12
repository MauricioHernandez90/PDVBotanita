// src/models/Customer.js
import mongoose from 'mongoose'

const customerSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true
    },
    telefono: {
      type: String,
      default: '',
      trim: true
    },
    direccion: {
      type: String,
      default: '',
      trim: true
    },
    limiteCredito: {
      type: Number,
      default: 0,
      min: 0
    },
    saldoActual: {
      type: Number,
      default: 0,
      min: 0
    },
    notas: {
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

customerSchema.index({ nombre: 'text' })

export default mongoose.model('Customer', customerSchema)
