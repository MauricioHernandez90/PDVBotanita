// src/models/Sale.js
import mongoose from 'mongoose'

const saleSchema = new mongoose.Schema(
  {
    folio: { type: String, required: true, unique: true },
    fecha: { type: Date, default: Date.now },
    cajeroId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
    metodoPago: {
      type: String,
      enum: ['Efectivo', 'Tarjeta', 'Transferencia', 'Fiado'],
      required: true
    },
    subtotal: { type: Number, required: true, min: 0 },
    impuestos: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    cambio: { type: Number, default: 0, min: 0 },
    montoRecibido: { type: Number, default: 0, min: 0 },
    estado: {
      type: String,
      enum: ['pagada', 'fiada', 'cancelada'],
      default: 'pagada'
    },
    notas: { type: String, default: '' }
  },
  { timestamps: true }
)

saleSchema.index({ fecha: -1 })
saleSchema.index({ cajeroId: 1, fecha: -1 })
saleSchema.index({ clienteId: 1, fecha: -1 })

export default mongoose.model('Sale', saleSchema)
