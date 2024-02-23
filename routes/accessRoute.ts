const router = require('express').Router()
import {
    handlerAccessReq,
    handlerAccessRes,
} from '../controllers/accessController'

//Send  message to Admin
router.post('/access-req', handlerAccessReq)

//Get message from Admin
router.post('/access-res', handlerAccessRes)

module.exports = router
