// src/routes/debt.routes.js
import { Router } from 'express'
import {
  listarDeudas,
  obtenerDeuda,
  registrarAbono,
  resumenDeudas
} from '../controllers/debt.controller.js'
import { proteger } from '../middlewares/auth.middleware.js'

const router = Router()
router.use(proteger)

router.get('/resumen', resumenDeudas)
router.get('/', listarDeudas)
router.get('/:id', obtenerDeuda)
router.post('/:id/abonar', registrarAbono)

export default router
