// src/helpers/inventario.helper.js
import Product from '../models/Product.js'
import InventoryMovement from '../models/InventoryMovement.js'

/**
 * Ajusta el stock de una presentación específica de un producto.
 * Usa operadores atómicos ($inc o $set) para evitar condiciones de carrera.
 *
 * @param {ObjectId} productoId - ID del producto
 * @param {ObjectId} presentacionId - ID de la presentación dentro del array
 * @param {Number} cantidad - Cantidad a sumar (positiva) o restar (negativa)
 * @param {String} tipo - 'entrada' | 'salida' | 'ajuste'
 * @param {String} motivo - Descripción del movimiento
 * @param {ObjectId} usuarioId - Quién hizo el movimiento
 * @returns {Object} { productoActualizado, movimiento }
 */
export const ajustarStock = async (
  productoId,
  presentacionId,
  cantidad,
  tipo,
  motivo = '',
  usuarioId = null
) => {
  // 1. Leer el producto antes del cambio (para guardar el stockAnterior)
  const productoAntes = await Product.findById(productoId)
  if (!productoAntes) {
    throw new Error('Producto no encontrado')
  }

  const presentacion = productoAntes.presentaciones.id(presentacionId)
  if (!presentacion) {
    throw new Error('Presentación no encontrada')
  }

  const stockAnterior = presentacion.stock

  // 2. Calcular nuevo stock según el tipo
  let nuevoStock
  let operador

  if (tipo === 'entrada') {
    nuevoStock = stockAnterior + cantidad
    operador = { $inc: { 'presentaciones.$.stock': cantidad } }
  } else if (tipo === 'salida') {
    nuevoStock = stockAnterior - cantidad
    if (nuevoStock < 0) {
      throw new Error(`Stock insuficiente. Disponible: ${stockAnterior}, solicitado: ${cantidad}`)
    }
    operador = { $inc: { 'presentaciones.$.stock': -cantidad } }
  } else if (tipo === 'ajuste') {
    // En ajuste, "cantidad" es el NUEVO stock absoluto
    nuevoStock = cantidad
    operador = { $set: { 'presentaciones.$.stock': cantidad } }
  } else {
    throw new Error(`Tipo de movimiento inválido: ${tipo}`)
  }

  // 3. Aplicar el cambio de forma atómica
  const productoActualizado = await Product.findOneAndUpdate(
    { _id: productoId, 'presentaciones._id': presentacionId },
    operador,
    { new: true }
  )

  if (!productoActualizado) {
    throw new Error('No se pudo actualizar el stock')
  }

  // 4. Registrar el movimiento en el historial
  const movimiento = await InventoryMovement.create({
    productoId,
    presentacionId,
    presentacionNombre: presentacion.nombre,
    tipo,
    cantidad,
    stockAnterior,
    stockNuevo: nuevoStock,
    motivo,
    usuarioId
  })

  return { productoActualizado, movimiento }
}

/**
 * Devuelve una lista de presentaciones con stock <= stockMinimo.
 * Útil para alertas de dashboard.
 */
export const obtenerBajoStock = async () => {
  const productos = await Product.find({ activo: true })
    .populate('categoriaId', 'nombre')
    .lean()

  const alertas = []

  for (const prod of productos) {
    for (const pres of prod.presentaciones) {
      if (pres.stock <= pres.stockMinimo) {
        alertas.push({
          productoId: prod._id,
          productoNombre: prod.nombre,
          categoria: prod.categoriaId?.nombre || 'Sin categoría',
          presentacionId: pres._id,
          presentacionNombre: pres.nombre,
          stock: pres.stock,
          stockMinimo: pres.stockMinimo,
          faltante: pres.stockMinimo - pres.stock
        })
      }
    }
  }

  // Ordenar por más críticos primero (mayor faltante)
  alertas.sort((a, b) => b.faltante - a.faltante)

  return alertas
}
