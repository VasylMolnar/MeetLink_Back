const router = require('express').Router()
import {
    handleGetUser,
    handlerUpdateUser,
    handlerDeleteUser,
    handleUploadImg,
    handleGetUserInfo,
    handleGetUsersList,
    handlerCreateMessages,
    handlerDeleteMessages,
    handlerCreateCall,
    handlerDeleteCall,
} from '../controllers/userController'

import multer from 'multer'
const upload = multer()

router
    .route('/:id')
    .get(handleGetUser) //get my info
    .put(handlerUpdateUser)
    .delete(handlerDeleteUser)

router.post('/:id/uploads', upload.single('image'), handleUploadImg)

// get current user info (secret method)
router.get('/info/:id', handleGetUserInfo)

// get users list (secret method)
router.get('/list/:id', handleGetUsersList)

//individual messages (secret method)
router.post('/messages', handlerCreateMessages)
router.delete('/messages/:id', handlerDeleteMessages)

//individual calls (secret method)
router.post('/call', handlerCreateCall)
router.delete('/call/:id', handlerDeleteCall)

module.exports = router
