// src/routes/product.routes.js
import { Router } from 'express'
import {
  listarProductos,
  obtenerProducto,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  buscarPorCodigo
} from '../controllers/product.controller.js'
import { proteger, soloAdmin } from '../middlewares/auth.middleware.js'

const router = Router()

router.use(proteger) // todas requieren login

router.get('/', listarProductos)
router.get('/buscar/:codigo', buscarPorCodigo)
router.get('/:id', obtenerProducto)
router.post('/', soloAdmin, crearProducto)
router.put('/:id', soloAdmin, actualizarProducto)
router.delete('/:id', soloAdmin, eliminarProducto)

export default router
