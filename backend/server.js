// server.js
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');

const app = express();

const apiRoutes = require('./routes/api');
const scheduler = require('./scheduler');

// Middleware to parse JSON requests
app.use(express.json());

// Middleware
app.use(cors({
  origin: process.env.CORS_DEV_FRONTEND_URL_AND_PORT,
  credentials: true // Allow cross-origin cookies
}));

app.use(session({
  name: "session",
  secret: process.env.SESSION_COOKIE_KEY,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax' // Avoid excessive browser restrictions
  }
}));

// Routes
app.use('/api/', apiRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});