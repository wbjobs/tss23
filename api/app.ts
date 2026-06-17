import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import modelsRoutes from './routes/models.js'
import templatesRoutes from './routes/templates.js'
import assertionsRoutes from './routes/assertions.js'
import evaluationsRoutes from './routes/evaluations.js'
import gatewayRoutes from './routes/gateway.js'
import logsRoutes from './routes/logs.js'
import statsRoutes from './routes/stats.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/models', modelsRoutes)
app.use('/api/templates', templatesRoutes)
app.use('/api/assertions', assertionsRoutes)
app.use('/api/evaluations', evaluationsRoutes)
app.use('/api/gateway', gatewayRoutes)
app.use('/api/logs', logsRoutes)
app.use('/api/stats', statsRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(error)
  res.status(500).json({
    success: false,
    error: 'Server internal error',
    message: error.message,
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
