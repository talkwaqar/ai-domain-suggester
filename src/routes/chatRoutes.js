/**
 * Chat Routes - Defines API endpoints for chat functionality
 */
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// POST /api/chat - Process chat messages and domain suggestions
router.post('/', chatController.processChat);

module.exports = router; 