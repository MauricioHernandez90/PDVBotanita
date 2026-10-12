// src/routes/customer.routes.js
import { Router } from 'express'
import {
  listarClientes,
  obtenerCliente,
  crearCliente,
  actualizarCliente,
  eliminarCliente
} from '../controllers/customer.controller.js'
import { proteger, soloAdmin } from '../middlewares/auth.middleware.js'

const router = Router()
router.use(proteger)

router.get('/', listarClientes)
router.get('/:id', obtenerCliente)
router.post('/', crearCliente)
router.put('/:id', actualizarCliente)
router.delete('/:id', soloAdmin, eliminarCliente)

export default router
