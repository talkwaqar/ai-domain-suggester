/**
 * Copyright (c) 2025 Waqar Ghaffar - All Rights Reserved
 *
 * Domain AI Finder - Main Application
 * 
 * A smart domain name finder that leverages AI to suggest and check availability of domain names.
 */
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

// Import configuration
const config = require('./config');

// Import middleware
const corsMiddleware = require('./middleware/cors');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const chatRoutes = require('./routes/chatRoutes');

// Initialize Express app
const app = express();

// Apply middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

// Apply CORS middleware
app.use(corsMiddleware);

// Define API routes
app.use('/api/chat', chatRoutes);

// Apply error handler
app.use(errorHandler);

module.exports = app; 