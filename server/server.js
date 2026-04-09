require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize } = require('./src/models');
const { errorHandler } = require('./src/middleware/errorHandler');

// Route imports
const authRoutes = require('./src/routes/auth');
const eventRoutes = require('./src/routes/events');
const wishlistRoutes = require('./src/routes/wishlist');
const rsvpRoutes = require('./src/routes/rsvp');
const contactRoutes = require('./src/routes/contacts');
const invitationRoutes = require('./src/routes/invitations');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS — explicitly allow production Vercel frontend and local dev
const allowedOrigins = [
  'https://event-management-pro.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Explicitly handle OPTIONS preflight requests with same CORS config
app.options('*', cors(corsOptions));

// Health check — includes DB status
let dbConnected = false;
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'EventWise API is running!', db: dbConnected ? 'connected' : 'connecting' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api', wishlistRoutes);
app.use('/api', rsvpRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api', invitationRoutes);

// Serve static files from built client
const clientBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath, {
  maxAge: '1h',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
    } else if (filePath.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml');
    }
  }
}));

// SPA fallback: serve index.html only for non-file routes
app.get('*', (req, res, next) => {
  // Don't serve index.html for asset files, API calls, or files with extensions  
  if (req.path.startsWith('/assets') || 
      req.path.startsWith('/api') ||
      req.path.includes('.')) {
    return next();
  }
  // For all other routes, serve index.html for SPA routing
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// Error handler
app.use(errorHandler);

// Start server immediately so CORS & routes are always available
app.listen(PORT, () => {
  console.log(`🚀 EventWise API running at http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
});

// Connect to DB after server is already listening (non-blocking)
const connectDB = async (retries = 5) => {
  for (let i = 1; i <= retries; i++) {
    try {
      await sequelize.authenticate();
      console.log('✅ Database connected successfully!');
      await sequelize.sync({ alter: false });
      console.log('✅ Database synced!');
      dbConnected = true;
      return;
    } catch (error) {
      console.error(`❌ DB connection attempt ${i}/${retries} failed: ${error.message}`);
      if (i < retries) {
        const wait = i * 3000;
        console.log(`⏳ Retrying in ${wait / 1000}s...`);
        await new Promise(r => setTimeout(r, wait));
      } else {
        console.error('❌ All DB connection attempts failed. API will return 503 for DB-dependent routes.');
      }
    }
  }
};

connectDB();
