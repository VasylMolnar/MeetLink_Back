const router = require('express').Router()
import {
    handlerAccessReq,
    handlerAccessRes,
    handlerDeleteMessage,
} from '../controllers/accessController'

//Send  message to Admin
router.post('/access-req', handlerAccessReq)

//Get message from Admin
router.post('/access-res', handlerAccessRes)

//Delete message
router.delete('/access-delete', handlerDeleteMessage)

module.exports = router
