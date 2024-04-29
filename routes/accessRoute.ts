const router = require('express').Router()
import {
    handlerAccessReq,
    handlerAccessReqFollow,
    handlerAccessRes,
    handlerAccessResFollow,
    handlerDeleteMessage,
    handlerDeleteFollow,
} from '../controllers/accessController'

//Send  message to Admin
router.post('/access-req', handlerAccessReq)

//Get message from Admin
router.post('/access-res', handlerAccessRes)

//Delete message
router.delete('/access-delete', handlerDeleteMessage)

//Send  message to User to follow
router.post('/follow-access-req', handlerAccessReqFollow)

//Get message from User
router.post('/follow-access-res', handlerAccessResFollow)

//Delete follow user
router.delete('/delete-follow-user', handlerDeleteFollow)

module.exports = router
