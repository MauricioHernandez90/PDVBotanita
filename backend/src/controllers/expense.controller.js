// src/controllers/expense.controller.js
import Expense from '../models/Expense.js'
import ExpenseCategory from '../models/ExpenseCategory.js'

// === CATEGORÍAS ===

export const listarCategorias = async (req, res) => {
  try {
    const { tipo } = req.query
    const filtro = { activo: true }
    if (tipo) filtro.tipo = tipo

    const categorias = await ExpenseCategory.find(filtro).sort({ nombre: 1 }).lean()
    res.json(categorias)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const crearCategoria = async (req, res) => {
  try {
    const { nombre, tipo, descripcion } = req.body
    if (!nombre || !tipo) return res.status(400).json({ message: 'Faltan campos' })

    const existe = await ExpenseCategory.findOne({ nombre })
    if (existe) return res.status(400).json({ message: 'Ya existe esa categoría' })

    const cat = await ExpenseCategory.create({ nombre, tipo, descripcion })
    res.status(201).json(cat)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// === GASTOS ===

export const listarGastos = async (req, res) => {
  try {
    const { desde, hasta, tipo, categoriaId, limit = 200 } = req.query
    const filtro = {}

    if (tipo) filtro.tipo = tipo
    if (categoriaId) filtro.categoriaId = categoriaId

    if (desde || hasta) {
      filtro.fecha = {}
      if (desde) filtro.fecha.$gte = new Date(desde)
      if (hasta) {
        const fin = new Date(hasta)
        fin.setHours(23, 59, 59, 999)
        filtro.fecha.$lte = fin
      }
    }

    const gastos = await Expense.find(filtro)
      .populate('categoriaId', 'nombre tipo')
      .populate('usuarioId', 'nombre')
      .sort({ fecha: -1 })
      .limit(parseInt(limit))
      .lean()

    res.json(gastos)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const crearGasto = async (req, res) => {
  try {
    const { fecha, concepto, monto, tipo, categoriaId, proveedor, metodoPago, notas } = req.body

    if (!concepto || !monto || !tipo || !categoriaId) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' })
    }

    const cat = await ExpenseCategory.findById(categoriaId)
    if (!cat) return res.status(404).json({ message: 'Categoría no encontrada' })

    const gasto = await Expense.create({
      fecha: fecha || new Date(),
      concepto,
      monto,
      tipo,
      categoriaId,
      proveedor: proveedor || '',
      metodoPago: metodoPago || 'Efectivo',
      notas: notas || '',
      usuarioId: req.user._id
    })

    const poblado = await gasto.populate('categoriaId', 'nombre tipo')
    res.status(201).json(poblado)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const actualizarGasto = async (req, res) => {
  try {
    const { fecha, concepto, monto, tipo, categoriaId, proveedor, metodoPago, notas } = req.body

    const gasto = await Expense.findById(req.params.id)
    if (!gasto) return res.status(404).json({ message: 'Gasto no encontrado' })

    if (fecha) gasto.fecha = fecha
    if (concepto) gasto.concepto = concepto
    if (monto !== undefined) gasto.monto = monto
    if (tipo) gasto.tipo = tipo
    if (categoriaId) gasto.categoriaId = categoriaId
    if (proveedor !== undefined) gasto.proveedor = proveedor
    if (metodoPago) gasto.metodoPago = metodoPago
    if (notas !== undefined) gasto.notas = notas

    await gasto.save()
    const poblado = await gasto.populate('categoriaId', 'nombre tipo')
    res.json(poblado)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const eliminarGasto = async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id)
    res.json({ message: 'Gasto eliminado' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const resumenGastos = async (req, res) => {
  try {
    const { desde, hasta } = req.query

    const filtro = {}
    if (desde || hasta) {
      filtro.fecha = {}
      if (desde) filtro.fecha.$gte = new Date(desde)
      if (hasta) {
        const fin = new Date(hasta)
        fin.setHours(23, 59, 59, 999)
        filtro.fecha.$lte = fin
      }
    }

    const gastos = await Expense.find(filtro)
      .populate('categoriaId', 'nombre tipo')
      .lean()

    let totalFijos = 0
    let totalVariables = 0
    const porCategoria = {}

    gastos.forEach((g) => {
      if (g.tipo === 'fijo') totalFijos += g.monto
      else totalVariables += g.monto

      const catNombre = g.categoriaId?.nombre || 'Sin categoría'
      porCategoria[catNombre] = (porCategoria[catNombre] || 0) + g.monto
    })

    const total = totalFijos + totalVariables

    const porCategoriaArray = Object.entries(porCategoria)
      .map(([nombre, monto]) => ({ nombre, monto: +monto.toFixed(2) }))
      .sort((a, b) => b.monto - a.monto)

    res.json({
      total: +total.toFixed(2),
      totalFijos: +totalFijos.toFixed(2),
      totalVariables: +totalVariables.toFixed(2),
      numeroGastos: gastos.length,
      porCategoria: porCategoriaArray
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
