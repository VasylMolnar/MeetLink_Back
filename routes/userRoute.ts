const router = require('express').Router()
import {
    handleGetUser,
    handlerUpdateUser,
    handlerDeleteUser,
    handleUploadImg,
} from '../controllers/userController'

import multer from 'multer'
const upload = multer()

router
    .route('/:id')
    .get(handleGetUser)
    .put(handlerUpdateUser)
    .delete(handlerDeleteUser)

router.post('/:id/uploads', upload.single('image'), handleUploadImg)

module.exports = router
