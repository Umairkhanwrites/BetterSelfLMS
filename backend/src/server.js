import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration supporting Next.js frontend
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.betterself.pk') ||
      origin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }
    // Allow any localhost origin in development
    if (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    return callback(null, true); // Dev convenience
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsers (support JSON & URL-encoded)
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Request logging in dev
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// Mount REST API contract router
app.use('/api', apiRoutes);

// Root greeting
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'BetterSelf Learning Management System API',
    status: 'online',
    version: '1.0.0',
    documentation: '/api/health'
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[ServerError]', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start listening if run directly (standalone Node.js server)
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(` BetterSelf LMS Backend Server listening on port ${PORT}`);
    console.log(` API Base: http://localhost:${PORT}/api`);
    console.log(` Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log(`=======================================================`);
  });
}

export default app;
