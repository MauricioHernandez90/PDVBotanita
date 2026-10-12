// src/models/CashSession.js
import mongoose from 'mongoose'

const cashSessionSchema = new mongoose.Schema(
  {
    cajeroId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fechaApertura: { type: Date, default: Date.now },
    fechaCierre: { type: Date, default: null },
    montoInicial: { type: Number, required: true, min: 0 },
    montoFinal: { type: Number, default: null },
    ventasEfectivo: { type: Number, default: 0 },
    ventasTarjeta: { type: Number, default: 0 },
    ventasTransferencia: { type: Number, default: 0 },
    ventasFiado: { type: Number, default: 0 },
    totalVentas: { type: Number, default: 0 },
    numeroVentas: { type: Number, default: 0 },
    diferencia: { type: Number, default: 0 },
    estado: { type: String, enum: ['abierta', 'cerrada'], default: 'abierta' },
    notas: { type: String, default: '' }
  },
  { timestamps: true }
)

cashSessionSchema.index({ cajeroId: 1, estado: 1 })

export default mongoose.model('CashSession', cashSessionSchema)
