// src/routes/inventory.routes.js
import { Router } from 'express'
import {
  listarMovimientos,
  historialPorProducto,
  registrarEntrada,
  registrarSalida,
  ajustarInventario,
  alertasBajoStock,
  resumenInventario
} from '../controllers/inventory.controller.js'
import { proteger, soloAdmin } from '../middlewares/auth.middleware.js'

const router = Router()

router.use(proteger) // todo requiere login

// Consultas (admin y cajero)
router.get('/movements', listarMovimientos)
router.get('/movements/:productoId', historialPorProducto)
router.get('/alerts', alertasBajoStock)
router.get('/resumen', resumenInventario)

// Acciones (admin y cajero pueden registrar entradas/salidas)
router.post('/entrada', registrarEntrada)
router.post('/salida', registrarSalida)

// Ajustes solo admin
router.put('/ajuste', soloAdmin, ajustarInventario)

export default router
