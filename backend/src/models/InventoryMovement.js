// src/models/InventoryMovement.js
import mongoose from 'mongoose'

const inventoryMovementSchema = new mongoose.Schema(
  {
    productoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    presentacionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    presentacionNombre: {
      type: String,
      required: true
    },
    tipo: {
      type: String,
      enum: ['entrada', 'salida', 'ajuste'],
      required: true
    },
    cantidad: {
      type: Number,
      required: true,
      min: 0
    },
    stockAnterior: {
      type: Number,
      required: true
    },
    stockNuevo: {
      type: Number,
      required: true
    },
    motivo: {
      type: String,
      default: '',
      trim: true
    },
    usuarioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
)

// Índices para acelerar consultas
inventoryMovementSchema.index({ productoId: 1, createdAt: -1 })
inventoryMovementSchema.index({ createdAt: -1 })

export default mongoose.model('InventoryMovement', inventoryMovementSchema)
