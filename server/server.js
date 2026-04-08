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

// Middleware
app.use(cors({
  origin: true, // Reflect request origin to allow credentials
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Explicitly handle OPTIONS preflight requests
app.options('*', cors());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'EventWise API is running!' });
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

// Database sync & start server
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully!');

    // Sync models (creates tables if they don't exist)
    await sequelize.sync({ alter: false });
    console.log('✅ Database synced!');

    app.listen(PORT, () => {
      console.log(`🚀 EventWise API running at http://localhost:${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Unable to connect to database:', error.message);
    console.log('\n💡 Make sure MySQL is running and the database exists.');
    console.log('   Create it with: CREATE DATABASE eventwise;');
    console.log('\n   Then update the .env file with your MySQL credentials.');
    process.exit(1);
  }
};

startServer();
