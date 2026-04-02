const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/register', register);  //POST /api/auth/register

router.post('/login', login);  //POST /api/auth/login

router.get('/me', authenticate, getMe);  //GET /api/auth/me — returns current logged-in user

module.exports = router;
