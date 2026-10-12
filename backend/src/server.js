// src/server.js
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './config/db.js'
import authRoutes from './routes/auth.routes.js'
import userRoutes from './routes/user.routes.js'
import categoryRoutes from './routes/category.routes.js'
import productRoutes from './routes/product.routes.js'
import inventoryRoutes from './routes/inventory.routes.js'
import saleRoutes from './routes/sale.routes.js'
import cashRoutes from './routes/cash.routes.js'
import customerRoutes from './routes/customer.routes.js'
import debtRoutes from './routes/debt.routes.js'
import expenseRoutes from './routes/expense.routes.js'
import dashboardRoutes from './routes/dashboard.routes.js'

dotenv.config()
connectDB()

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Servidor de La Botanita funcionando 🚀',
    timestamp: new Date().toISOString()
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/products', productRoutes)
app.use('/api/inventory', inventoryRoutes)
app.use('/api/sales', saleRoutes)
app.use('/api/cash', cashRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/debts', debtRoutes)
app.use('/api/expenses', expenseRoutes)
app.use('/api/dashboard', dashboardRoutes)

const PORT = process.env.PORT || 3000

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en http://0.0.0.0:${PORT}`)
  console.log(`📍 Accesible desde la red en http://192.168.1.66:${PORT}`)
})
