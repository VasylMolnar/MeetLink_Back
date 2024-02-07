const router = require('express').Router()
import {
    handleGetUser,
    handlerUpdateUser,
    handlerDeleteUser,
} from '../controllers/userController'

router
    .route('/:id')
    .get(handleGetUser)
    .put(handlerUpdateUser)
    .delete(handlerDeleteUser)

module.exports = router
