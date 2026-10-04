// src/controllers/product.controller.js
import Product from '../models/Product.js'

// GET /api/products?search=xxx&categoria=yyy&bajoStock=true
export const listarProductos = async (req, res) => {
  try {
    const { search, categoria, bajoStock } = req.query
    const filtro = { activo: true }

    if (search) {
      filtro.$or = [
        { nombre: { $regex: search, $options: 'i' } },
        { codigoBarras: { $regex: search, $options: 'i' } }
      ]
    }

    if (categoria) {
      filtro.categoriaId = categoria
    }

    let productos = await Product.find(filtro)
      .populate('categoriaId', 'nombre')
      .sort({ nombre: 1 })
      .lean()

    // Filtro post-consulta: productos con alguna presentación bajo stock
    if (bajoStock === 'true') {
      productos = productos.filter((p) =>
        p.presentaciones.some((pres) => pres.stock <= pres.stockMinimo)
      )
    }

    res.json(productos)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// GET /api/products/:id
export const obtenerProducto = async (req, res) => {
  try {
    const producto = await Product.findById(req.params.id).populate('categoriaId', 'nombre')
    if (!producto) return res.status(404).json({ message: 'Producto no encontrado' })
    res.json(producto)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// POST /api/products
export const crearProducto = async (req, res) => {
  try {
    const { nombre, categoriaId, codigoBarras, presentaciones } = req.body

    if (!nombre || !categoriaId || !presentaciones?.length) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' })
    }

    const producto = await Product.create({
      nombre,
      categoriaId,
      codigoBarras: codigoBarras || '',
      presentaciones
    })

    const poblado = await producto.populate('categoriaId', 'nombre')
    res.status(201).json(poblado)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// PUT /api/products/:id
export const actualizarProducto = async (req, res) => {
  try {
    const { nombre, categoriaId, codigoBarras, presentaciones, activo } = req.body
    const producto = await Product.findById(req.params.id)
    if (!producto) return res.status(404).json({ message: 'Producto no encontrado' })

    if (nombre) producto.nombre = nombre
    if (categoriaId) producto.categoriaId = categoriaId
    if (codigoBarras !== undefined) producto.codigoBarras = codigoBarras
    if (presentaciones) producto.presentaciones = presentaciones
    if (typeof activo === 'boolean') producto.activo = activo

    await producto.save()
    const poblado = await producto.populate('categoriaId', 'nombre')
    res.json(poblado)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// DELETE /api/products/:id (soft delete: solo desactiva)
export const eliminarProducto = async (req, res) => {
  try {
    const producto = await Product.findByIdAndUpdate(
      req.params.id,
      { activo: false },
      { new: true }
    )
    if (!producto) return res.status(404).json({ message: 'Producto no encontrado' })
    res.json({ message: 'Producto desactivado', producto })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// GET /api/products/buscar/:codigo - Buscar por código de barras (para el POS)
export const buscarPorCodigo = async (req, res) => {
  try {
    const producto = await Product.findOne({ codigoBarras: req.params.codigo, activo: true })
      .populate('categoriaId', 'nombre')
    if (!producto) return res.status(404).json({ message: 'Producto no encontrado' })
    res.json(producto)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
