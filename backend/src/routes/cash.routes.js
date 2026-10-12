// src/routes/cash.routes.js
import { Router } from 'express'
import { abrirSesion, cerrarSesion, sesionActual, historialSesiones } from '../controllers/cash.controller.js'
import { proteger } from '../middlewares/auth.middleware.js'

const router = Router()
router.use(proteger)

router.post('/abrir', abrirSesion)
router.post('/cerrar', cerrarSesion)
router.get('/actual', sesionActual)
router.get('/historial', historialSesiones)

export default router
