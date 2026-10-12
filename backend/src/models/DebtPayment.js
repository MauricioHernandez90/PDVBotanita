// src/models/DebtPayment.js
import mongoose from 'mongoose'

const debtPaymentSchema = new mongoose.Schema(
  {
    deudaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Debt',
      required: true
    },
    clienteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    },
    monto: {
      type: Number,
      required: true,
      min: 0
    },
    metodoPago: {
      type: String,
      enum: ['Efectivo', 'Tarjeta', 'Transferencia'],
      default: 'Efectivo'
    },
    nota: {
      type: String,
      default: ''
    },
    usuarioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
)

debtPaymentSchema.index({ deudaId: 1, fecha: -1 })

export default mongoose.model('DebtPayment', debtPaymentSchema)
