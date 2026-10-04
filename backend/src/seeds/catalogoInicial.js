// src/seeds/catalogoInicial.js
// Script para cargar el catálogo inicial de "La Botanita"
// Ejecutar con: node src/seeds/catalogoInicial.js

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Category from '../models/Category.js'
import Product from '../models/Product.js'

dotenv.config()

// Catálogo según la tabla del negocio
// ⚠️ AJUSTA los precios reales según la imagen original de "La Botanita"
const catalogo = [
  {
    categoria: 'Frituras',
    productos: [
      {
        nombre: 'Chicharrón de cerdo',
        presentaciones: [
          { nombre: 'Bolsita', precio: 15, stock: 20, stockMinimo: 5 },
          { nombre: '100 gr', precio: 30, stock: 15, stockMinimo: 5 },
          { nombre: '250 gr', precio: 65, stock: 10, stockMinimo: 3 },
          { nombre: '450 gr', precio: 110, stock: 8, stockMinimo: 3 },
          { nombre: '1 Kg', precio: 220, stock: 5, stockMinimo: 2 }
        ]
      },
      {
        nombre: 'Papas fritas',
        presentaciones: [
          { nombre: 'Bolsita', precio: 15, stock: 30, stockMinimo: 10 },
          { nombre: '100 gr', precio: 28, stock: 20, stockMinimo: 5 },
          { nombre: '250 gr', precio: 60, stock: 15, stockMinimo: 5 },
          { nombre: '450 gr', precio: 100, stock: 10, stockMinimo: 3 },
          { nombre: '1 Kg', precio: 200, stock: 5, stockMinimo: 2 }
        ]
      },
      {
        nombre: 'Cacahuates japoneses',
        presentaciones: [
          { nombre: 'Bolsita', precio: 15, stock: 25, stockMinimo: 8 },
          { nombre: '100 gr', precio: 30, stock: 20, stockMinimo: 5 },
          { nombre: '250 gr', precio: 65, stock: 15, stockMinimo: 5 },
          { nombre: '450 gr', precio: 115, stock: 10, stockMinimo: 3 },
          { nombre: '1 Kg', precio: 230, stock: 5, stockMinimo: 2 }
        ]
      },
      {
        nombre: 'Churritos',
        presentaciones: [
          { nombre: 'Bolsita', precio: 12, stock: 30, stockMinimo: 10 },
          { nombre: '100 gr', precio: 25, stock: 20, stockMinimo: 5 },
          { nombre: '250 gr', precio: 55, stock: 12, stockMinimo: 4 },
          { nombre: '450 gr', precio: 95, stock: 8, stockMinimo: 3 },
          { nombre: '1 Kg', precio: 190, stock: 4, stockMinimo: 2 }
        ]
      },
      {
        nombre: 'Totopos',
        presentaciones: [
          { nombre: 'Bolsita', precio: 15, stock: 25, stockMinimo: 8 },
          { nombre: '100 gr', precio: 28, stock: 20, stockMinimo: 5 },
          { nombre: '250 gr', precio: 60, stock: 15, stockMinimo: 5 },
          { nombre: '450 gr', precio: 105, stock: 10, stockMinimo: 3 },
          { nombre: '1 Kg', precio: 210, stock: 5, stockMinimo: 2 }
        ]
      }
    ]
  },
  {
    categoria: 'Tostadas',
    productos: [
      {
        nombre: 'Tostada de maíz',
        presentaciones: [
          { nombre: 'Bolsita', precio: 20, stock: 20, stockMinimo: 5 },
          { nombre: '100 gr', precio: 35, stock: 15, stockMinimo: 5 },
          { nombre: '250 gr', precio: 75, stock: 10, stockMinimo: 3 },
          { nombre: '450 gr', precio: 130, stock: 8, stockMinimo: 3 },
          { nombre: '1 Kg', precio: 260, stock: 5, stockMinimo: 2 }
        ]
      },
      {
        nombre: 'Tostada de harina',
        presentaciones: [
          { nombre: 'Bolsita', precio: 22, stock: 15, stockMinimo: 5 },
          { nombre: '100 gr', precio: 38, stock: 12, stockMinimo: 4 },
          { nombre: '250 gr', precio: 80, stock: 10, stockMinimo: 3 },
          { nombre: '450 gr', precio: 140, stock: 6, stockMinimo: 2 },
          { nombre: '1 Kg', precio: 280, stock: 4, stockMinimo: 2 }
        ]
      }
    ]
  },
  {
    categoria: 'Encurtidos',
    productos: [
      {
        nombre: 'Cueritos',
        presentaciones: [
          { nombre: 'Bolsita', precio: 25, stock: 15, stockMinimo: 5 },
          { nombre: '100 gr', precio: 45, stock: 12, stockMinimo: 4 },
          { nombre: '250 gr', precio: 100, stock: 8, stockMinimo: 3 },
          { nombre: '450 gr', precio: 170, stock: 5, stockMinimo: 2 },
          { nombre: '1 Kg', precio: 350, stock: 3, stockMinimo: 1 }
        ]
      },
      {
        nombre: 'Encurtido mixto',
        presentaciones: [
          { nombre: 'Bolsita', precio: 20, stock: 20, stockMinimo: 5 },
          { nombre: '100 gr', precio: 38, stock: 15, stockMinimo: 5 },
          { nombre: '250 gr', precio: 85, stock: 10, stockMinimo: 3 },
          { nombre: '450 gr', precio: 150, stock: 6, stockMinimo: 2 },
          { nombre: '1 Kg', precio: 300, stock: 4, stockMinimo: 2 }
        ]
      }
    ]
  }
]

const cargarCatalogo = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Conectado a MongoDB')

    // Limpiar catálogos previos
    await Category.deleteMany({})
    await Product.deleteMany({})
    console.log('🧹 Categorías y productos anteriores eliminados')

    for (const bloque of catalogo) {
      const categoria = await Category.create({ nombre: bloque.categoria })
      console.log(`📂 Categoría creada: ${categoria.nombre}`)

      for (const prod of bloque.productos) {
        await Product.create({
          nombre: prod.nombre,
          categoriaId: categoria._id,
          codigoBarras: '',
          presentaciones: prod.presentaciones
        })
        console.log(`  └─ Producto: ${prod.nombre}`)
      }
    }

    console.log('\n🎉 Catálogo inicial cargado exitosamente')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

cargarCatalogo()
