// src/controllers/dashboard.controller.js
import Sale from '../models/Sale.js'
import SaleItem from '../models/SaleItem.js'
import Product from '../models/Product.js'
import Expense from '../models/Expense.js'
import Debt from '../models/Debt.js'
import DebtPayment from '../models/DebtPayment.js'

/**
 * Devuelve el rango de fechas según el período solicitado
 */
const calcularRango = (periodo, desde, hasta) => {
  const ahora = new Date()
  let inicio, fin = ahora

  if (periodo === 'hoy') {
    inicio = new Date()
    inicio.setHours(0, 0, 0, 0)
  } else if (periodo === 'semana') {
    // La semana empieza en LUNES
    inicio = new Date()
    const diaSemana = inicio.getDay() // 0=Domingo, 1=Lunes, ..., 6=Sábado
    const diff = diaSemana === 0 ? 6 : diaSemana - 1
    inicio.setDate(inicio.getDate() - diff)
    inicio.setHours(0, 0, 0, 0)
  } else if (periodo === 'mes') {
    inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
  } else if (periodo === 'anio') {
    inicio = new Date(ahora.getFullYear(), 0, 1)
  } else if (desde) {
    inicio = new Date(desde)
    if (hasta) {
      fin = new Date(hasta)
      fin.setHours(23, 59, 59, 999)
    }
  } else {
    // Por defecto: hoy
    inicio = new Date()
    inicio.setHours(0, 0, 0, 0)
  }

  return { inicio, fin }
}

/**
 * GET /api/dashboard/resumen?periodo=hoy|semana|mes|anio|personalizado&desde=&hasta=
 */
export const resumen = async (req, res) => {
  try {
    const { periodo = 'hoy', desde, hasta } = req.query
    const { inicio, fin } = calcularRango(periodo, desde, hasta)

    // === VENTAS ===
    const ventas = await Sale.find({
      fecha: { $gte: inicio, $lte: fin },
      estado: { $ne: 'cancelada' }
    }).lean()

    const totalVentas = ventas.reduce((s, v) => s + v.total, 0)
    const numeroVentas = ventas.length
    const ticketPromedio = numeroVentas > 0 ? totalVentas / numeroVentas : 0

    const porMetodo = { Efectivo: 0, Tarjeta: 0, Transferencia: 0, Fiado: 0 }
    ventas.forEach((v) => {
      porMetodo[v.metodoPago] = +(porMetodo[v.metodoPago] + v.total).toFixed(2)
    })

    // === GASTOS ===
    const gastos = await Expense.find({
      fecha: { $gte: inicio, $lte: fin }
    }).lean()

    const totalGastos = gastos.reduce((s, g) => s + g.monto, 0)
    const gastosFijos = gastos.filter((g) => g.tipo === 'fijo').reduce((s, g) => s + g.monto, 0)
    const gastosVariables = gastos.filter((g) => g.tipo === 'variable').reduce((s, g) => s + g.monto, 0)

    // === COSTO DE MERCANCÍA VENDIDA (aproximado al 60% del precio) ===
    // Se puede ajustar después con márgenes reales por producto
    const costoMercancia = totalVentas * 0.6
    const utilidadBruta = totalVentas - costoMercancia
    const utilidadNeta = utilidadBruta - totalGastos

    // === DEUDAS ===
    const deudasPendientes = await Debt.find({ estado: { $in: ['pendiente', 'vencida'] } }).lean()
    const totalPorCobrar = deudasPendientes.reduce((s, d) => s + d.saldoPendiente, 0)

    const abonosPeriodo = await DebtPayment.find({
      createdAt: { $gte: inicio, $lte: fin }
    }).lean()
    const totalCobrado = abonosPeriodo.reduce((s, a) => s + a.monto, 0)

    res.json({
      periodo: { inicio, fin },
      ventas: {
        total: +totalVentas.toFixed(2),
        numero: numeroVentas,
        ticketPromedio: +ticketPromedio.toFixed(2),
        porMetodo
      },
      gastos: {
        total: +totalGastos.toFixed(2),
        fijos: +gastosFijos.toFixed(2),
        variables: +gastosVariables.toFixed(2),
        numero: gastos.length
      },
      balance: {
        ventas: +totalVentas.toFixed(2),
        costoMercancia: +costoMercancia.toFixed(2),
        utilidadBruta: +utilidadBruta.toFixed(2),
        gastos: +totalGastos.toFixed(2),
        utilidadNeta: +utilidadNeta.toFixed(2)
      },
      deudas: {
        porCobrar: +totalPorCobrar.toFixed(2),
        cobradoEnPeriodo: +totalCobrado.toFixed(2)
      }
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

/**
 * GET /api/dashboard/ventas-diarias?dias=30
 * Devuelve las ventas de los últimos N días para gráfica
 */
export const ventasDiarias = async (req, res) => {
  try {
    const dias = parseInt(req.query.dias) || 30
    const desde = new Date()
    desde.setDate(desde.getDate() - dias)
    desde.setHours(0, 0, 0, 0)

    const resultado = await Sale.aggregate([
      { $match: { fecha: { $gte: desde }, estado: { $ne: 'cancelada' } } },
      {
        $group: {
          _id: {
            year: { $year: { date: '$fecha', timezone: 'America/Mexico_City' } },
            month: { $month: { date: '$fecha', timezone: 'America/Mexico_City' } },
            day: { $dayOfMonth: { date: '$fecha', timezone: 'America/Mexico_City' } }
          },
          total: { $sum: '$total' },
          numero: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ])

    const datos = resultado.map((r) => ({
      fecha: `${r._id.year}-${String(r._id.month).padStart(2, '0')}-${String(r._id.day).padStart(2, '0')}`,
      total: +r.total.toFixed(2),
      numero: r.numero
    }))

    res.json(datos)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

/**
 * GET /api/dashboard/ventas-por-hora?periodo=mes
 * Devuelve las ventas agrupadas por hora (0-23) para identificar horas pico
 */
export const ventasPorHora = async (req, res) => {
  try {
    const { periodo = 'semana' } = req.query
    const { inicio, fin } = calcularRango(periodo)

    const resultado = await Sale.aggregate([
      { $match: { fecha: { $gte: inicio, $lte: fin }, estado: { $ne: 'cancelada' } } },
      {
        $group: {
          _id: { $hour: { date: '$fecha', timezone: 'America/Mexico_City' } },
          total: { $sum: '$total' },
          numero: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])
    
    // Rellenar las 24 horas
    const horas = []
    for (let h = 0; h < 24; h++) {
      const encontrado = resultado.find((r) => r._id === h)
      horas.push({
        hora: h,
        total: encontrado ? +encontrado.total.toFixed(2) : 0,
        numero: encontrado ? encontrado.numero : 0
      })
    }

    res.json(horas)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

/**
 * GET /api/dashboard/top-productos?periodo=mes&limit=10
 * Top productos más vendidos por cantidad y por ingresos
 */
export const topProductos = async (req, res) => {
  try {
    const { periodo = 'mes', limit = 10 } = req.query
    const { inicio, fin } = calcularRango(periodo)

    const ventas = await Sale.find({
      fecha: { $gte: inicio, $lte: fin },
      estado: { $ne: 'cancelada' }
    }).select('_id').lean()

    const ventaIds = ventas.map((v) => v._id)

    if (ventaIds.length === 0) {
      return res.json([])
    }

    const resultado = await SaleItem.aggregate([
      { $match: { ventaId: { $in: ventaIds } } },
      {
        $group: {
          _id: { productoId: '$productoId', presentacionNombre: '$presentacionNombre' },
          nombre: { $first: '$productoNombre' },
          presentacion: { $first: '$presentacionNombre' },
          cantidad: { $sum: '$cantidad' },
          ingresos: { $sum: '$subtotal' }
        }
      },
      { $sort: { cantidad: -1 } },
      { $limit: parseInt(limit) }
    ])

    res.json(resultado.map((r) => ({
      productoId: r._id.productoId,
      nombre: r.nombre,
      presentacion: r.presentacion,
      cantidad: r.cantidad,
      ingresos: +r.ingresos.toFixed(2)
    })))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

/**
 * GET /api/dashboard/comparacion?periodo=semana
 * Compara el período actual con el anterior del mismo tipo
 */
export const comparacion = async (req, res) => {
  try {
    const { periodo = 'semana' } = req.query
    const ahora = new Date()

    let inicioActual, finActual, inicioAnterior, finAnterior

    if (periodo === 'hoy') {
      inicioActual = new Date(); inicioActual.setHours(0, 0, 0, 0)
      finActual = new Date()

      inicioAnterior = new Date(inicioActual); inicioAnterior.setDate(inicioAnterior.getDate() - 1)
      finAnterior = new Date(finActual); finAnterior.setDate(finAnterior.getDate() - 1)
    } else if (periodo === 'semana') {
      inicioActual = new Date(); inicioActual.setDate(ahora.getDate() - ahora.getDay()); inicioActual.setHours(0, 0, 0, 0)
      finActual = new Date()

      inicioAnterior = new Date(inicioActual); inicioAnterior.setDate(inicioAnterior.getDate() - 7)
      finAnterior = new Date(finActual); finAnterior.setDate(finAnterior.getDate() - 7)
    } else if (periodo === 'mes') {
      inicioActual = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
      finActual = new Date()

      inicioAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1)
      finAnterior = new Date(ahora.getFullYear(), ahora.getMonth(), 0, 23, 59, 59)
    }

    const ventasActual = await Sale.find({
      fecha: { $gte: inicioActual, $lte: finActual },
      estado: { $ne: 'cancelada' }
    }).lean()

    const ventasAnterior = await Sale.find({
      fecha: { $gte: inicioAnterior, $lte: finAnterior },
      estado: { $ne: 'cancelada' }
    }).lean()

    const totalActual = ventasActual.reduce((s, v) => s + v.total, 0)
    const totalAnterior = ventasAnterior.reduce((s, v) => s + v.total, 0)
    const diferencia = totalActual - totalAnterior
    const porcentaje = totalAnterior > 0 ? (diferencia / totalAnterior) * 100 : (totalActual > 0 ? 100 : 0)

    res.json({
      actual: +totalActual.toFixed(2),
      anterior: +totalAnterior.toFixed(2),
      diferencia: +diferencia.toFixed(2),
      porcentaje: +porcentaje.toFixed(1),
      tendencia: diferencia > 0 ? 'sube' : (diferencia < 0 ? 'baja' : 'igual')
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}


/**
 * GET /api/dashboard/ventas-periodo?periodo=hoy|semana|mes|anio
 * Devuelve las ventas agrupadas según el período:
 *   hoy → por hora (0-23)
 *   semana → por día de la semana (Lun-Dom)
 *   mes → por día del mes (1-31)
 *   anio → por mes (Ene-Dic)
 */
export const ventasPeriodo = async (req, res) => {
  try {
    const { periodo = 'hoy' } = req.query
    const { inicio, fin } = calcularRango(periodo)

    // ========== HOY: agrupar por hora ==========
    if (periodo === 'hoy') {
      const resultado = await Sale.aggregate([
        { $match: { fecha: { $gte: inicio, $lte: fin }, estado: { $ne: 'cancelada' } } },
        {
          $group: {
            _id: { $hour: { date: '$fecha', timezone: 'America/Mexico_City' } },
            total: { $sum: '$total' },
            numero: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])

      const detalle = []
      for (let h = 0; h < 24; h++) {
        const enc = resultado.find((r) => r._id === h)
        detalle.push({
          label: `${h}:00`,
          total: enc ? +enc.total.toFixed(2) : 0,
          numero: enc ? enc.numero : 0
        })
      }

      return res.json({
        titulo: 'Ventas de hoy por hora',
        labels: detalle.map((d) => d.label),
        datos: detalle.map((d) => d.total),
        detalle
      })
    }

    // ========== SEMANA: agrupar por día de la semana ==========
    if (periodo === 'semana') {
      const resultado = await Sale.aggregate([
        { $match: { fecha: { $gte: inicio, $lte: fin }, estado: { $ne: 'cancelada' } } },
        {
          $group: {
            _id: { $dayOfWeek: { date: '$fecha', timezone: 'America/Mexico_City' } },
            total: { $sum: '$total' },
            numero: { $sum: 1 }
          }
        }
      ])

      // Fechas de la semana actual (Lun a Dom)
      const nombres = { 1: 'Dom', 2: 'Lun', 3: 'Mar', 4: 'Mié', 5: 'Jue', 6: 'Vie', 7: 'Sáb' }
      const orden = [2, 3, 4, 5, 6, 7, 1] // Lun -> Dom

      // Calcular la fecha del lunes de esta semana
      const lunes = new Date()
      const diaSemana = lunes.getDay()
      const diff = diaSemana === 0 ? 6 : diaSemana - 1
      lunes.setDate(lunes.getDate() - diff)

      const detalle = orden.map((d, idx) => {
        const enc = resultado.find((r) => r._id === d)

        // Fecha correspondiente a este día
        const fecha = new Date(lunes)
        fecha.setDate(lunes.getDate() + idx)
        const dia = String(fecha.getDate()).padStart(2, '0')
        const mes = String(fecha.getMonth() + 1).padStart(2, '0')
        const esHoy = fecha.toDateString() === new Date().toDateString()

        return {
          label: `${nombres[d]} ${dia}/${mes}`,
          diaSemana: nombres[d],
          fecha: `${dia}/${mes}`,
          esHoy,
          total: enc ? +enc.total.toFixed(2) : 0,
          numero: enc ? enc.numero : 0
        }
      })

      return res.json({
        titulo: 'Ventas de esta semana por día',
        labels: detalle.map((d) => d.label),
        datos: detalle.map((d) => d.total),
        detalle
      })
    }

    // ========== MES: agrupar por día del mes ==========
    if (periodo === 'mes') {
      const resultado = await Sale.aggregate([
        { $match: { fecha: { $gte: inicio, $lte: fin }, estado: { $ne: 'cancelada' } } },
        {
          $group: {
            _id: { $dayOfMonth: { date: '$fecha', timezone: 'America/Mexico_City' } },
            total: { $sum: '$total' },
            numero: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])

      const ultimoDia = new Date(fin.getFullYear(), fin.getMonth() + 1, 0).getDate()
      const nombresCortos = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
      const detalle = []
      for (let d = 1; d <= ultimoDia; d++) {
        const enc = resultado.find((r) => r._id === d)
        const esInicioSemana = d === 1 || d === 8 || d === 15 || d === 22 || d === 29

        const fecha = new Date(fin.getFullYear(), fin.getMonth(), d)
        const nombreDia = nombresCortos[fecha.getDay()]

        detalle.push({
          label: `${d} ${nombreDia}`,
          total: enc ? +enc.total.toFixed(2) : 0,
          numero: enc ? enc.numero : 0,
          esInicioSemana
        })
      }

      return res.json({
        titulo: `Ventas del mes actual (${ultimoDia} días)`,
        labels: detalle.map((d) => d.label),
        datos: detalle.map((d) => d.total),
        detalle
      })
    }

    // ========== AÑO: agrupar por mes ==========
    if (periodo === 'anio') {
      const resultado = await Sale.aggregate([
        { $match: { fecha: { $gte: inicio, $lte: fin }, estado: { $ne: 'cancelada' } } },
        {
          $group: {
            _id: { $month: { date: '$fecha', timezone: 'America/Mexico_City' } },
            total: { $sum: '$total' },
            numero: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])

      const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
      const detalle = []
      for (let m = 1; m <= 12; m++) {
        const enc = resultado.find((r) => r._id === m)
        detalle.push({
          label: meses[m - 1],
          total: enc ? +enc.total.toFixed(2) : 0,
          numero: enc ? enc.numero : 0
        })
      }

      return res.json({
        titulo: 'Ventas del año por mes',
        labels: detalle.map((d) => d.label),
        datos: detalle.map((d) => d.total),
        detalle
      })
    }

    // Fallback
    res.json({ titulo: 'Sin datos', labels: [], datos: [], detalle: [] })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
