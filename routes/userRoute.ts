const router = require('express').Router()
import {
    handleGetUser,
    handlerUpdateUser,
    handlerDeleteUser,
    handleUploadImg,
    handleGetUserInfo,
    handleGetUsersList,
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

// get users list
router.get('/list/:id', handleGetUsersList)

module.exports = router
