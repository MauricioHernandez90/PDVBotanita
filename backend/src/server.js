// src/server.js
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './config/db.js'
import authRoutes from './routes/auth.routes.js'
import userRoutes from './routes/user.routes.js'
import categoryRoutes from './routes/category.routes.js'
import productRoutes from './routes/product.routes.js'

// Cargar variables de entorno
dotenv.config()

// Conectar a MongoDB
connectDB()

const app = express()

// Middlewares globales
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Ruta pública de diagnóstico
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Servidor de La Botanita funcionando 🚀',
    timestamp: new Date().toISOString()
  })
})

// Rutas de la API
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/products', productRoutes)

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
})
