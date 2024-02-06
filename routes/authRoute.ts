const router = require('express').Router()
const authController = require('../controllers/authController')

router
    .post('/', authController.handleRegister)
    .post('/login', authController.handleLogin)
    .post('/logout', authController.handleLogout)

module.exports = router
