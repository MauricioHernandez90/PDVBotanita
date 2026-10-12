// src/models/Expense.js
import mongoose from 'mongoose'

const expenseSchema = new mongoose.Schema(
  {
    fecha: {
      type: Date,
      default: Date.now,
      required: true
    },
    concepto: {
      type: String,
      required: [true, 'El concepto es obligatorio'],
      trim: true
    },
    monto: {
      type: Number,
      required: true,
      min: 0
    },
    tipo: {
      type: String,
      enum: ['fijo', 'variable'],
      required: true
    },
    categoriaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExpenseCategory',
      required: true
    },
    proveedor: {
      type: String,
      default: '',
      trim: true
    },
    metodoPago: {
      type: String,
      enum: ['Efectivo', 'Transferencia', 'Tarjeta', 'Otro'],
      default: 'Efectivo'
    },
    notas: {
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

expenseSchema.index({ fecha: -1 })
expenseSchema.index({ categoriaId: 1, fecha: -1 })
expenseSchema.index({ tipo: 1, fecha: -1 })

export default mongoose.model('Expense', expenseSchema)
