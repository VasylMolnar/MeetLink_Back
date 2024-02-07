const router = require('express').Router()
import {
    handlerCreateMeet,
    handlerUpdateMeet,
    handlerDeleteMeet,
} from '../controllers/meetController'

router
    .route('/')
    .post(handlerCreateMeet)
    .put(handlerUpdateMeet)
    .delete(handlerDeleteMeet)

module.exports = router
