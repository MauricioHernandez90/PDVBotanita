// src/helpers/caja.helper.js
import CashSession from '../models/CashSession.js'

export const sesionAbiertaDeCajero = async (cajeroId) => {
  return await CashSession.findOne({ cajeroId, estado: 'abierta' })
}

export const abrirCaja = async (cajeroId, montoInicial) => {
  const abierta = await sesionAbiertaDeCajero(cajeroId)
  if (abierta) throw new Error('Ya tienes una sesión de caja abierta')
  return await CashSession.create({ cajeroId, montoInicial, estado: 'abierta' })
}

export const cerrarCaja = async (cajeroId, montoFinal, notas = '') => {
  const sesion = await sesionAbiertaDeCajero(cajeroId)
  if (!sesion) throw new Error('No tienes una sesión de caja abierta')

  sesion.fechaCierre = new Date()
  sesion.montoFinal = montoFinal
  sesion.diferencia = montoFinal - (sesion.montoInicial + sesion.ventasEfectivo)
  sesion.estado = 'cerrada'
  if (notas) sesion.notas = notas

  await sesion.save()
  return sesion
}
