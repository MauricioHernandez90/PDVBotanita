// src/controllers/sale.controller.js
import Sale from '../models/Sale.js'
import SaleItem from '../models/SaleItem.js'
import Product from '../models/Product.js'
import Settings from '../models/Settings.js'
import Customer from '../models/Customer.js'
import Debt from '../models/Debt.js'
import { generarFolio } from '../helpers/folio.helper.js'
import { ajustarStock } from '../helpers/inventario.helper.js'
import { sesionAbiertaDeCajero } from '../helpers/caja.helper.js'

export const crearVenta = async (req, res) => {
  try {
    const { items, metodoPago, montoRecibido = 0, clienteId, notas = '' } = req.body

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'El carrito está vacío' })
    }
    if (!['Efectivo', 'Tarjeta', 'Transferencia', 'Fiado'].includes(metodoPago)) {
      return res.status(400).json({ message: 'Método de pago inválido' })
    }
    if (metodoPago === 'Fiado' && !clienteId) {
      return res.status(400).json({ message: 'Para fiado debes seleccionar un cliente' })
    }

    const sesion = await sesionAbiertaDeCajero(req.user._id)
    if (!sesion) {
      return res.status(400).json({ message: 'No tienes una sesión de caja abierta' })
    }

    // Validar cliente si es fiado
    let cliente = null
    if (metodoPago === 'Fiado') {
      cliente = await Customer.findById(clienteId)
      if (!cliente) return res.status(404).json({ message: 'Cliente no encontrado' })

      // Calcular total primero para verificar límite
      let tempSubtotal = 0
      for (const item of items) {
        const prod = await Product.findById(item.productoId)
        if (prod) {
          const pres = prod.presentaciones.id(item.presentacionId)
          if (pres) tempSubtotal += pres.precio * item.cantidad
        }
      }

      let settingsTemp = await Settings.findOne()
      if (!settingsTemp) settingsTemp = await Settings.create({})
      const tempTotal = tempSubtotal + tempSubtotal * ((settingsTemp.impuestoPorcentaje || 0) / 100)

      if (cliente.limiteCredito > 0 && cliente.saldoActual + tempTotal > cliente.limiteCredito) {
        return res.status(400).json({
          message: `El cliente excede su límite de crédito. Debe $${cliente.saldoActual.toFixed(2)} de $${cliente.limiteCredito.toFixed(2)}. Esta venta es de $${tempTotal.toFixed(2)}.`
        })
      }
    }

    // Recolectar productos y calcular
    const itemsPreparados = []
    let subtotal = 0

    for (const item of items) {
      const producto = await Product.findById(item.productoId)
      if (!producto) return res.status(404).json({ message: 'Producto no encontrado' })

      const presentacion = producto.presentaciones.id(item.presentacionId)
      if (!presentacion) return res.status(404).json({ message: 'Presentación no encontrada' })

      if (presentacion.stock < item.cantidad) {
        return res.status(400).json({
          message: `Stock insuficiente de ${producto.nombre} (${presentacion.nombre}). Disponible: ${presentacion.stock}`
        })
      }

      const subtotalItem = presentacion.precio * item.cantidad
      itemsPreparados.push({
        productoId: producto._id,
        productoNombre: producto.nombre,
        presentacionId: presentacion._id,
        presentacionNombre: presentacion.nombre,
        cantidad: item.cantidad,
        precioUnitario: presentacion.precio,
        subtotal: subtotalItem
      })
      subtotal += subtotalItem
    }

    let settings = await Settings.findOne()
    if (!settings) settings = await Settings.create({})
    const impuestoPorcentaje = settings.impuestoPorcentaje || 0
    const impuestos = +(subtotal * (impuestoPorcentaje / 100)).toFixed(2)
    const total = +(subtotal + impuestos).toFixed(2)

    let cambio = 0
    if (metodoPago === 'Efectivo') {
      if (montoRecibido < total) {
        return res.status(400).json({ message: `Monto recibido insuficiente. Total: $${total}` })
      }
      cambio = +(montoRecibido - total).toFixed(2)
    }

    const folio = await generarFolio()

    const venta = await Sale.create({
      folio,
      cajeroId: req.user._id,
      clienteId: metodoPago === 'Fiado' ? clienteId : null,
      metodoPago,
      subtotal,
      impuestos,
      total,
      cambio,
      montoRecibido: metodoPago === 'Efectivo' ? montoRecibido : 0,
      estado: metodoPago === 'Fiado' ? 'fiada' : 'pagada',
      notas
    })

    const itemsConVentaId = itemsPreparados.map((it) => ({ ...it, ventaId: venta._id }))
    const itemsCreados = await SaleItem.insertMany(itemsConVentaId)

    for (const item of itemsPreparados) {
      await ajustarStock(
        item.productoId,
        item.presentacionId,
        item.cantidad,
        'salida',
        `Venta ${folio}`,
        req.user._id
      )
    }

    // === Si es fiado, crear la deuda y actualizar saldo del cliente ===
    let deuda = null
    if (metodoPago === 'Fiado') {
      const fechaVencimiento = new Date()
      fechaVencimiento.setDate(fechaVencimiento.getDate() + 30) // 30 días por defecto

      deuda = await Debt.create({
        clienteId: cliente._id,
        ventaId: venta._id,
        folioVenta: folio,
        montoTotal: total,
        saldoPendiente: total,
        fechaVencimiento,
        estado: 'pendiente'
      })

      cliente.saldoActual = +(cliente.saldoActual + total).toFixed(2)
      await cliente.save()
    }

    sesion.numeroVentas += 1
    sesion.totalVentas = +(sesion.totalVentas + total).toFixed(2)
    if (metodoPago === 'Efectivo') sesion.ventasEfectivo = +(sesion.ventasEfectivo + total).toFixed(2)
    else if (metodoPago === 'Tarjeta') sesion.ventasTarjeta = +(sesion.ventasTarjeta + total).toFixed(2)
    else if (metodoPago === 'Transferencia') sesion.ventasTransferencia = +(sesion.ventasTransferencia + total).toFixed(2)
    else if (metodoPago === 'Fiado') sesion.ventasFiado = +(sesion.ventasFiado + total).toFixed(2)
    await sesion.save()

    res.status(201).json({
      message: 'Venta registrada',
      venta,
      items: itemsCreados,
      cambio,
      folio,
      deuda
    })
  } catch (error) {
    console.error('Error en crearVenta:', error)
    res.status(500).json({ message: error.message })
  }
}

export const listarVentas = async (req, res) => {
  try {
    const { desde, hasta, cajero, metodoPago, cliente, limit = 100 } = req.query
    const filtro = {}
    if (cajero) filtro.cajeroId = cajero
    if (metodoPago) filtro.metodoPago = metodoPago
    if (cliente) filtro.clienteId = cliente
    if (desde || hasta) {
      filtro.fecha = {}
      if (desde) filtro.fecha.$gte = new Date(desde)
      if (hasta) filtro.fecha.$lte = new Date(hasta)
    }

    const ventas = await Sale.find(filtro)
      .populate('cajeroId', 'nombre')
      .populate('clienteId', 'nombre telefono')
      .sort({ fecha: -1 })
      .limit(parseInt(limit))
      .lean()

    res.json(ventas)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const obtenerVenta = async (req, res) => {
  try {
    const venta = await Sale.findById(req.params.id)
      .populate('cajeroId', 'nombre')
      .populate('clienteId', 'nombre telefono direccion')
    if (!venta) return res.status(404).json({ message: 'Venta no encontrada' })
    const items = await SaleItem.find({ ventaId: venta._id })
    res.json({ venta, items })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const resumenHoy = async (req, res) => {
  try {
    const inicio = new Date()
    inicio.setHours(0, 0, 0, 0)
    const fin = new Date()
    fin.setHours(23, 59, 59, 999)

    const ventas = await Sale.find({
      fecha: { $gte: inicio, $lte: fin },
      estado: { $ne: 'cancelada' }
    }).lean()

    const totalVentas = ventas.reduce((sum, v) => sum + v.total, 0)
    const numeroVentas = ventas.length
    const ticketPromedio = numeroVentas > 0 ? totalVentas / numeroVentas : 0

    const porMetodo = { Efectivo: 0, Tarjeta: 0, Transferencia: 0, Fiado: 0 }
    ventas.forEach((v) => {
      porMetodo[v.metodoPago] = +(porMetodo[v.metodoPago] + v.total).toFixed(2)
    })

    res.json({
      totalVentas: +totalVentas.toFixed(2),
      numeroVentas,
      ticketPromedio: +ticketPromedio.toFixed(2),
      porMetodo
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
