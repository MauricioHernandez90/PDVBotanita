// src/models/SaleItem.js
import mongoose from 'mongoose'

const saleItemSchema = new mongoose.Schema(
  {
    ventaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', required: true },
    productoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productoNombre: { type: String, required: true },
    presentacionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    presentacionNombre: { type: String, required: true },
    cantidad: { type: Number, required: true, min: 1 },
    precioUnitario: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 }
  },
  { timestamps: true }
)

saleItemSchema.index({ ventaId: 1 })

export default mongoose.model('SaleItem', saleItemSchema)
