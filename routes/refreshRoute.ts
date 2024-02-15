const router = require('express').Router()
import { handleRefreshJWT } from '../controllers/refreshTokenController'

router.get('/', handleRefreshJWT)

module.exports = router
