// src/controllers/debt.controller.js
import Debt from '../models/Debt.js'
import DebtPayment from '../models/DebtPayment.js'
import Customer from '../models/Customer.js'

// GET /api/debts?cliente=xxx&estado=pendiente
export const listarDeudas = async (req, res) => {
  try {
    const { cliente, estado, soloVencidas } = req.query
    const filtro = {}

    if (cliente) filtro.clienteId = cliente
    if (estado) filtro.estado = estado

    if (soloVencidas === 'true') {
      filtro.estado = 'pendiente'
      filtro.fechaVencimiento = { $lt: new Date() }
    }

    const deudas = await Debt.find(filtro)
      .populate('clienteId', 'nombre telefono')
      .sort({ fecha: -1 })
      .lean()

    // Marcar como vencidas las que ya pasaron su fecha
    const ahora = new Date()
    const deudasActualizadas = deudas.map((d) => {
      if (d.estado === 'pendiente' && d.fechaVencimiento && new Date(d.fechaVencimiento) < ahora) {
        return { ...d, estado: 'vencida' }
      }
      return d
    })

    res.json(deudasActualizadas)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// GET /api/debts/:id  (incluye abonos)
export const obtenerDeuda = async (req, res) => {
  try {
    const deuda = await Debt.findById(req.params.id).populate('clienteId', 'nombre telefono direccion')
    if (!deuda) return res.status(404).json({ message: 'Deuda no encontrada' })

    const abonos = await DebtPayment.find({ deudaId: deuda._id })
      .populate('usuarioId', 'nombre')
      .sort({ createdAt: -1 })
      .lean()

    res.json({ deuda, abonos })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// POST /api/debts/:id/abonar
// Body: { monto, metodoPago, nota }
export const registrarAbono = async (req, res) => {
  try {
    const { monto, metodoPago = 'Efectivo', nota = '' } = req.body

    if (!monto || monto <= 0) {
      return res.status(400).json({ message: 'Monto inválido' })
    }

    const deuda = await Debt.findById(req.params.id)
    if (!deuda) return res.status(404).json({ message: 'Deuda no encontrada' })
    if (deuda.estado === 'pagada') {
      return res.status(400).json({ message: 'Esta deuda ya está pagada' })
    }
    if (monto > deuda.saldoPendiente) {
      return res.status(400).json({
        message: `El monto excede el saldo pendiente ($${deuda.saldoPendiente.toFixed(2)})`
      })
    }

    // Crear el abono
    const abono = await DebtPayment.create({
      deudaId: deuda._id,
      clienteId: deuda.clienteId,
      monto,
      metodoPago,
      nota,
      usuarioId: req.user._id
    })

    // Actualizar la deuda
    deuda.saldoPendiente = +(deuda.saldoPendiente - monto).toFixed(2)
    if (deuda.saldoPendiente <= 0) {
      deuda.saldoPendiente = 0
      deuda.estado = 'pagada'
    }
    await deuda.save()

    // Actualizar el saldo del cliente
    const cliente = await Customer.findById(deuda.clienteId)
    if (cliente) {
      cliente.saldoActual = +(cliente.saldoActual - monto).toFixed(2)
      if (cliente.saldoActual < 0) cliente.saldoActual = 0
      await cliente.save()
    }

    res.status(201).json({
      message: 'Abono registrado',
      abono,
      deuda
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// GET /api/debts/resumen  (para dashboard de deudores)
export const resumenDeudas = async (req, res) => {
  try {
    const deudasPendientes = await Debt.find({ estado: { $in: ['pendiente', 'vencida'] } }).lean()

    const ahora = new Date()
    let totalPorCobrar = 0
    let totalVencido = 0
    let numeroDeudores = 0

    const clientesConDeuda = new Set()

    deudasPendientes.forEach((d) => {
      totalPorCobrar += d.saldoPendiente
      clientesConDeuda.add(d.clienteId.toString())
      if (d.fechaVencimiento && new Date(d.fechaVencimiento) < ahora) {
        totalVencido += d.saldoPendiente
      }
    })

    numeroDeudores = clientesConDeuda.size

    // Abonos del día
    const inicio = new Date()
    inicio.setHours(0, 0, 0, 0)
    const abonosHoy = await DebtPayment.find({ createdAt: { $gte: inicio } }).lean()
    const totalAbonadoHoy = abonosHoy.reduce((sum, a) => sum + a.monto, 0)

    res.json({
      totalPorCobrar: +totalPorCobrar.toFixed(2),
      totalVencido: +totalVencido.toFixed(2),
      numeroDeudores,
      totalAbonadoHoy: +totalAbonadoHoy.toFixed(2),
      numeroAbonosHoy: abonosHoy.length
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
