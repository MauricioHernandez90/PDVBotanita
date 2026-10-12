// src/routes/expense.routes.js
import { Router } from 'express'
import {
  listarCategorias,
  crearCategoria,
  listarGastos,
  crearGasto,
  actualizarGasto,
  eliminarGasto,
  resumenGastos
} from '../controllers/expense.controller.js'
import { proteger, soloAdmin } from '../middlewares/auth.middleware.js'

const router = Router()
router.use(proteger)

// Categorías
router.get('/categories', listarCategorias)
router.post('/categories', soloAdmin, crearCategoria)

// Resumen
router.get('/resumen', resumenGastos)

// Gastos
router.get('/', listarGastos)
router.post('/', soloAdmin, crearGasto)
router.put('/:id', soloAdmin, actualizarGasto)
router.delete('/:id', soloAdmin, eliminarGasto)

export default router
