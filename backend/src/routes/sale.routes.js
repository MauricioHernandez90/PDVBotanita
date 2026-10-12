// src/routes/sale.routes.js
import { Router } from 'express'
import { crearVenta, listarVentas, obtenerVenta, resumenHoy } from '../controllers/sale.controller.js'
import { proteger } from '../middlewares/auth.middleware.js'

const router = Router()
router.use(proteger)

router.post('/', crearVenta)
router.get('/', listarVentas)
router.get('/resumen-hoy', resumenHoy)
router.get('/:id', obtenerVenta)

export default router
