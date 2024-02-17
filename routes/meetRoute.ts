const router = require('express').Router()
import {
    handlerCreateMeet,
    handlerUpdateMeet,
    handlerDeleteMeet,
    handleUploadImg,
} from '../controllers/meetController'

import multer from 'multer'
const upload = multer()

router.post('/', upload.single('image'), handlerCreateMeet)

router.route('/:id').put(handlerUpdateMeet).delete(handlerDeleteMeet)

//Update meet img
router.post('/:id/uploads', upload.single('image'), handleUploadImg)

module.exports = router
