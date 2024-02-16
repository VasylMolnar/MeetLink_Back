const router = require('express').Router()
import {
    handlerCreateMeet,
    handlerUpdateMeet,
    handlerDeleteMeet,
    handleUploadImg,
} from '../controllers/meetController'

import multer from 'multer'
const upload = multer()

router.post('/', handlerCreateMeet)

router.route('/:id').put(handlerUpdateMeet).delete(handlerDeleteMeet)

router.post('/:id/uploads', upload.single('image'), handleUploadImg)

module.exports = router
