// src/helpers/folio.helper.js
import Sale from '../models/Sale.js'

export const generarFolio = async () => {
  const ultima = await Sale.findOne().sort({ folio: -1 }).lean()
  let siguienteNumero = 1
  if (ultima && ultima.folio) {
    const num = parseInt(ultima.folio.replace('V-', ''), 10)
    if (!isNaN(num)) siguienteNumero = num + 1
  }
  return `V-${String(siguienteNumero).padStart(4, '0')}`
}
