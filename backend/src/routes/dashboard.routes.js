// src/routes/dashboard.routes.js
import { Router } from 'express'
import {
  resumen,
  ventasDiarias,
  ventasPorHora,
  topProductos,
  comparacion,
  ventasPeriodo
} from '../controllers/dashboard.controller.js'
import { proteger } from '../middlewares/auth.middleware.js'

const router = Router()
router.use(proteger)

router.get('/resumen', resumen)
router.get('/ventas-diarias', ventasDiarias)
router.get('/ventas-por-hora', ventasPorHora)
router.get('/ventas-periodo', ventasPeriodo)
router.get('/top-productos', topProductos)
router.get('/comparacion', comparacion)

export default router
