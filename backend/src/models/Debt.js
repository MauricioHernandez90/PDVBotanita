// src/models/Debt.js
import mongoose from 'mongoose'

const debtSchema = new mongoose.Schema(
  {
    clienteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    },
    ventaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sale',
      default: null
    },
    folioVenta: {
      type: String,
      default: ''
    },
    montoTotal: {
      type: Number,
      required: true,
      min: 0
    },
    saldoPendiente: {
      type: Number,
      required: true,
      min: 0
    },
    fecha: {
      type: Date,
      default: Date.now
    },
    fechaVencimiento: {
      type: Date,
      default: null
    },
    estado: {
      type: String,
      enum: ['pendiente', 'pagada', 'vencida'],
      default: 'pendiente'
    },
    notas: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
)

debtSchema.index({ clienteId: 1, estado: 1 })
debtSchema.index({ fecha: -1 })

export default mongoose.model('Debt', debtSchema)
