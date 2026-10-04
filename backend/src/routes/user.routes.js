// src/routes/user.routes.js
import { Router } from 'express'
import {
  listarUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario
} from '../controllers/user.controller.js'
import { proteger, soloAdmin } from '../middlewares/auth.middleware.js'

const router = Router()

// Todas estas rutas requieren estar logueado Y ser admin
router.use(proteger, soloAdmin)

router.get('/', listarUsuarios)
router.post('/', crearUsuario)
router.put('/:id', actualizarUsuario)
router.delete('/:id', eliminarUsuario)

export default router
