const router = require('express').Router()
import {
    handlerGetCurrentMeet,
    handlerCreateMeet,
    handlerUpdateMeet,
    handlerDeleteMeet,
    handlerLeaveMeet,
    handlerUploadImg,
} from '../controllers/meetController'

import multer from 'multer'
const upload = multer()

router.post('/', upload.single('image'), handlerCreateMeet)

// delete meet admin
router
    .route('/:id')
    .put(handlerUpdateMeet)
    .delete(handlerDeleteMeet)
    .get(handlerGetCurrentMeet)

// delete meet user if we want leave this meet
router.route('/:id/:id').put(handlerUpdateMeet).delete(handlerLeaveMeet)

//Update meet img
router.post('/:id/uploads', upload.single('image'), handlerUploadImg)

module.exports = router
