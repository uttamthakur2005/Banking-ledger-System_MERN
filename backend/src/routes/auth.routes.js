const express = require('express')
const authController = require('../controllers/auth.controller')

const router = express.Router()

/* POST /api/auth/register */
router.post('/register', authController.userRegister)

/* POST /api/auth/login */
router.post('/login', authController.userLogin)

/* POST /api/auth/logout */
router.post('/logout', authController.userLogout)

module.exports = router