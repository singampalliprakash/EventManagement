require('dotenv').config();
const express = require('express');
const cors = require('cors');
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
  origin: function (origin, callback) {
    if (!origin || origin.startsWith('http://localhost') || origin.includes('vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'EventWise API is running!' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api', wishlistRoutes);
app.use('/api', rsvpRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api', invitationRoutes);

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
