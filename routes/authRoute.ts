const router = require('express').Router()
import {
    handleRegister,
    handleLogin,
    handleLogout,
} from '../controllers/authController'

router
    .post('/', handleRegister)
    .post('/login', handleLogin)
    .post('/logout', handleLogout)

module.exports = router
