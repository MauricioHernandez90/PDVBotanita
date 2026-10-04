// src/routes/category.routes.js
import { Router } from 'express'
import {
  listarCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria
} from '../controllers/category.controller.js'
import { proteger, soloAdmin } from '../middlewares/auth.middleware.js'

const router = Router()

router.use(proteger) // todas requieren login

router.get('/', listarCategorias)
router.post('/', soloAdmin, crearCategoria)
router.put('/:id', soloAdmin, actualizarCategoria)
router.delete('/:id', soloAdmin, eliminarCategoria)

export default router
