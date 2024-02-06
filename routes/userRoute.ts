const router = require('express').Router()
import {
    handleGetUser,
    handlerUpdateUser,
    handlerDeleteUser,
} from '../controllers/userController'

router
    .get('/', handleGetUser)
    .put('/', handlerUpdateUser)
    .delete('/', handlerDeleteUser)

module.exports = router
