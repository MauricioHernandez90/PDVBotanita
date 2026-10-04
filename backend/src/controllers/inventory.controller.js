// src/controllers/inventory.controller.js
import Product from '../models/Product.js'
import InventoryMovement from '../models/InventoryMovement.js'
import { ajustarStock, obtenerBajoStock } from '../helpers/inventario.helper.js'

export const listarMovimientos = async (req, res) => {
  try {
    const { producto, tipo, desde, hasta, limit = 100 } = req.query
    const filtro = {}

    if (producto) filtro.productoId = producto
    if (tipo) filtro.tipo = tipo

    if (desde || hasta) {
      filtro.createdAt = {}
      if (desde) filtro.createdAt.$gte = new Date(desde)
      if (hasta) filtro.createdAt.$lte = new Date(hasta)
    }

    const movimientos = await InventoryMovement.find(filtro)
      .populate('productoId', 'nombre')
      .populate('usuarioId', 'nombre')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean()

    res.json(movimientos)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const historialPorProducto = async (req, res) => {
  try {
    const movimientos = await InventoryMovement.find({ productoId: req.params.productoId })
      .populate('usuarioId', 'nombre')
      .sort({ createdAt: -1 })
      .lean()

    res.json(movimientos)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const registrarEntrada = async (req, res) => {
  try {
    const { productoId, presentacionId, cantidad, motivo } = req.body

    if (!productoId || !presentacionId || !cantidad || cantidad <= 0) {
      return res.status(400).json({ message: 'Datos incompletos o cantidad inválida' })
    }

    const { productoActualizado, movimiento } = await ajustarStock(
      productoId,
      presentacionId,
      cantidad,
      'entrada',
      motivo || 'Entrada manual',
      req.user._id
    )

    res.status(201).json({
      message: 'Entrada registrada',
      producto: productoActualizado,
      movimiento
    })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

export const registrarSalida = async (req, res) => {
  try {
    const { productoId, presentacionId, cantidad, motivo } = req.body

    if (!productoId || !presentacionId || !cantidad || cantidad <= 0) {
      return res.status(400).json({ message: 'Datos incompletos o cantidad inválida' })
    }

    const { productoActualizado, movimiento } = await ajustarStock(
      productoId,
      presentacionId,
      cantidad,
      'salida',
      motivo || 'Salida manual',
      req.user._id
    )

    res.status(201).json({
      message: 'Salida registrada',
      producto: productoActualizado,
      movimiento
    })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

export const ajustarInventario = async (req, res) => {
  try {
    const { productoId, presentacionId, nuevoStock, motivo } = req.body

    if (!productoId || !presentacionId || nuevoStock === undefined || nuevoStock < 0) {
      return res.status(400).json({ message: 'Datos incompletos o stock inválido' })
    }

    const { productoActualizado, movimiento } = await ajustarStock(
      productoId,
      presentacionId,
      nuevoStock,
      'ajuste',
      motivo || 'Ajuste manual',
      req.user._id
    )

    res.json({
      message: 'Inventario ajustado',
      producto: productoActualizado,
      movimiento
    })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

export const alertasBajoStock = async (req, res) => {
  try {
    const alertas = await obtenerBajoStock()
    res.json(alertas)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const resumenInventario = async (req, res) => {
  try {
    const productos = await Product.find({ activo: true }).lean()

    let totalPresentaciones = 0
    let valorTotalInventario = 0
    let presentacionesBajoStock = 0

    for (const prod of productos) {
      for (const pres of prod.presentaciones) {
        totalPresentaciones++
        valorTotalInventario += pres.stock * pres.precio
        if (pres.stock <= pres.stockMinimo) presentacionesBajoStock++
      }
    }

    res.json({
      totalProductos: productos.length,
      totalPresentaciones,
      valorTotalInventario,
      presentacionesBajoStock
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
