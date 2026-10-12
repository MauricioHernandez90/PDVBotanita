// src/seeds/categoriasGasto.js
// Ejecutar con: node src/seeds/categoriasGasto.js

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import ExpenseCategory from '../models/ExpenseCategory.js'

dotenv.config()

const categorias = [
  // Fijos
  { nombre: 'Renta del local', tipo: 'fijo', descripcion: 'Pago mensual del espacio' },
  { nombre: 'Luz', tipo: 'fijo', descripcion: 'CFE' },
  { nombre: 'Agua', tipo: 'fijo', descripcion: 'Servicio de agua' },
  { nombre: 'Internet', tipo: 'fijo', descripcion: 'Servicio de internet y telefonía' },
  { nombre: 'Sueldos', tipo: 'fijo', descripcion: 'Pago a empleados con salario base' },
  { nombre: 'Contador', tipo: 'fijo', descripcion: 'Servicios contables' },
  { nombre: 'Seguros', tipo: 'fijo', descripcion: 'Seguro del local' },

  // Variables
  { nombre: 'Resurtido de mercancía', tipo: 'variable', descripcion: 'Compra de botanas, frituras, etc.' },
  { nombre: 'Empaques y desechables', tipo: 'variable', descripcion: 'Bolsas, vasos, servilletas' },
  { nombre: 'Mermas', tipo: 'variable', descripcion: 'Producto vencido, roto o dañado' },
  { nombre: 'Transporte y fletes', tipo: 'variable', descripcion: 'Gasolina o fletes para traer mercancía' },
  { nombre: 'Mantenimiento', tipo: 'variable', descripcion: 'Reparaciones y mantenimiento' },
  { nombre: 'Publicidad', tipo: 'variable', descripcion: 'Volantes, promociones, redes sociales' },
  { nombre: 'Papelería y limpieza', tipo: 'variable', descripcion: 'Artículos de oficina y aseo' },
  { nombre: 'Varios', tipo: 'variable', descripcion: 'Gastos no clasificados' }
]

const cargar = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Conectado a MongoDB')

    await ExpenseCategory.deleteMany({})
    console.log('🧹 Categorías anteriores eliminadas')

    for (const cat of categorias) {
      await ExpenseCategory.create(cat)
      console.log(`📂 ${cat.tipo.toUpperCase()}: ${cat.nombre}`)
    }

    console.log('\n🎉 Categorías de gasto cargadas')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

cargar()
