// src/models/Product.js
import mongoose from 'mongoose'

// Subesquema para cada presentación
const presentacionSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      enum: ['Bolsita', '100 gr', '250 gr', '450 gr', '1 Kg']
    },
    precio: {
      type: Number,
      required: true,
      min: 0
    },
    stock: {
      type: Number,
      default: 0,
      min: 0
    },
    stockMinimo: {
      type: Number,
      default: 5,
      min: 0
    }
  },
  { _id: true } // cada presentación tiene su propio _id
)

const productSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true
    },
    categoriaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    codigoBarras: {
      type: String,
      trim: true,
      default: '',
      sparse: true // permite múltiples vacíos sin conflicto de unique
    },
    presentaciones: {
      type: [presentacionSchema],
      validate: {
        validator: (arr) => arr.length > 0,
        message: 'Debe tener al menos una presentación'
      }
    },
    activo: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
)

// Índice para búsquedas rápidas por nombre
productSchema.index({ nombre: 'text' })

export default mongoose.model('Product', productSchema)
