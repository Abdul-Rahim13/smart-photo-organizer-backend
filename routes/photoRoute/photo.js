const express = require('express')
const router = express.Router()
const {authMiddleware} = require('../../middleware/AuthMiddleware')
const upload = require ('../../middleware/uploadMiddleware')
const { uploadPhoto } = require('../../controller/photoController/photo');

router.post('/upload', authMiddleware, upload.array('images', 5), uploadPhoto)

module.exports = router