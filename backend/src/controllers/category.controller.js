// src/controllers/category.controller.js
import Category from '../models/Category.js'
import Product from '../models/Product.js'

// GET /api/categories
export const listarCategorias = async (req, res) => {
  try {
    const categorias = await Category.find().sort({ nombre: 1 }).lean()
    res.json(categorias)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// POST /api/categories
export const crearCategoria = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body
    if (!nombre) return res.status(400).json({ message: 'El nombre es obligatorio' })

    const existe = await Category.findOne({ nombre })
    if (existe) return res.status(400).json({ message: 'Ya existe esa categoría' })

    const categoria = await Category.create({ nombre, descripcion })
    res.status(201).json(categoria)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// PUT /api/categories/:id
export const actualizarCategoria = async (req, res) => {
  try {
    const { nombre, descripcion, activo } = req.body
    const categoria = await Category.findById(req.params.id)
    if (!categoria) return res.status(404).json({ message: 'Categoría no encontrada' })

    if (nombre) categoria.nombre = nombre
    if (descripcion !== undefined) categoria.descripcion = descripcion
    if (typeof activo === 'boolean') categoria.activo = activo

    await categoria.save()
    res.json(categoria)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// DELETE /api/categories/:id
export const eliminarCategoria = async (req, res) => {
  try {
    // Verificar que no tenga productos asociados
    const productosAsociados = await Product.countDocuments({ categoriaId: req.params.id })
    if (productosAsociados > 0) {
      return res.status(400).json({
        message: `No se puede eliminar: hay ${productosAsociados} productos en esta categoría`
      })
    }

    await Category.findByIdAndDelete(req.params.id)
    res.json({ message: 'Categoría eliminada' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
