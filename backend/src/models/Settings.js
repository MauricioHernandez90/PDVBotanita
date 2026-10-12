// src/models/Settings.js
import mongoose from 'mongoose'

const settingsSchema = new mongoose.Schema(
  {
    nombreNegocio: { type: String, default: 'La Botanita' },
    direccion: { type: String, default: '' },
    telefono: { type: String, default: '' },
    rfc: { type: String, default: '' },
    impuestoPorcentaje: { type: Number, default: 0, min: 0, max: 100 },
    formatoTicket: { type: String, default: '58mm', enum: ['58mm', '80mm', 'pdf'] },
    logotipo: { type: String, default: '' }
  },
  { timestamps: true }
)

export default mongoose.model('Settings', settingsSchema)
