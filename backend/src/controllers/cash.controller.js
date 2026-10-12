// src/controllers/cash.controller.js
import CashSession from '../models/CashSession.js'
import { abrirCaja, cerrarCaja, sesionAbiertaDeCajero } from '../helpers/caja.helper.js'

export const abrirSesion = async (req, res) => {
  try {
    const { montoInicial } = req.body
    if (montoInicial === undefined || montoInicial < 0) {
      return res.status(400).json({ message: 'Monto inicial inválido' })
    }
    const sesion = await abrirCaja(req.user._id, montoInicial)
    res.status(201).json({ message: 'Caja abierta', sesion })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

export const cerrarSesion = async (req, res) => {
  try {
    const { montoFinal, notas = '' } = req.body
    if (montoFinal === undefined || montoFinal < 0) {
      return res.status(400).json({ message: 'Monto final inválido' })
    }
    const sesion = await cerrarCaja(req.user._id, montoFinal, notas)
    res.json({ message: 'Caja cerrada', sesion })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

export const sesionActual = async (req, res) => {
  try {
    const sesion = await sesionAbiertaDeCajero(req.user._id)
    res.json({ sesion: sesion || null })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const historialSesiones = async (req, res) => {
  try {
    const { cajero, limit = 50 } = req.query
    const filtro = {}
    if (cajero) filtro.cajeroId = cajero
    const sesiones = await CashSession.find(filtro)
      .populate('cajeroId', 'nombre')
      .sort({ fechaApertura: -1 })
      .limit(parseInt(limit))
      .lean()
    res.json(sesiones)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
