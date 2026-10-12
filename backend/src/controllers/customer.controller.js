// src/controllers/customer.controller.js
import Customer from '../models/Customer.js'
import Debt from '../models/Debt.js'

export const listarClientes = async (req, res) => {
  try {
    const { search, soloDeudores } = req.query
    const filtro = { activo: true }

    if (search) {
      filtro.$or = [
        { nombre: { $regex: search, $options: 'i' } },
        { telefono: { $regex: search, $options: 'i' } }
      ]
    }
    if (soloDeudores === 'true') {
      filtro.saldoActual = { $gt: 0 }
    }

    const clientes = await Customer.find(filtro).sort({ nombre: 1 }).lean()
    res.json(clientes)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const obtenerCliente = async (req, res) => {
  try {
    const cliente = await Customer.findById(req.params.id)
    if (!cliente) return res.status(404).json({ message: 'Cliente no encontrado' })

    const deudas = await Debt.find({ clienteId: cliente._id })
      .sort({ fecha: -1 })
      .lean()

    res.json({ cliente, deudas })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const crearCliente = async (req, res) => {
  try {
    const { nombre, telefono, direccion, limiteCredito, notas } = req.body
    if (!nombre) return res.status(400).json({ message: 'El nombre es obligatorio' })

    const cliente = await Customer.create({
      nombre,
      telefono: telefono || '',
      direccion: direccion || '',
      limiteCredito: limiteCredito || 0,
      notas: notas || ''
    })

    res.status(201).json(cliente)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const actualizarCliente = async (req, res) => {
  try {
    const { nombre, telefono, direccion, limiteCredito, notas, activo } = req.body
    const cliente = await Customer.findById(req.params.id)
    if (!cliente) return res.status(404).json({ message: 'Cliente no encontrado' })

    if (nombre) cliente.nombre = nombre
    if (telefono !== undefined) cliente.telefono = telefono
    if (direccion !== undefined) cliente.direccion = direccion
    if (limiteCredito !== undefined) cliente.limiteCredito = limiteCredito
    if (notas !== undefined) cliente.notas = notas
    if (typeof activo === 'boolean') cliente.activo = activo

    await cliente.save()
    res.json(cliente)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const eliminarCliente = async (req, res) => {
  try {
    const cliente = await Customer.findById(req.params.id)
    if (!cliente) return res.status(404).json({ message: 'Cliente no encontrado' })

    if (cliente.saldoActual > 0) {
      return res.status(400).json({
        message: `No se puede eliminar: el cliente debe $${cliente.saldoActual.toFixed(2)}`
      })
    }

    await Customer.findByIdAndUpdate(req.params.id, { activo: false })
    res.json({ message: 'Cliente desactivado' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
