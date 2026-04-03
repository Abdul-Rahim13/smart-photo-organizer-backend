const express = require('express')
const router = express.Router()
const upload = require('../../middleware/uploadMiddleware')
const { authMiddleware } = require('../../middleware/AuthMiddleware')
const { uploadPhoto, getAllPhotos, filterPhotos, getByScene, getTopPhotos, getPhotosWithFaces, getFlaggedPhotos, searchPhotos, deletePhoto, updatePhotoMetadata } = require('../../controller/photoController/photo')



router.post('/upload', authMiddleware, upload.array('images', 5), uploadPhoto )

router.get('/', authMiddleware, getAllPhotos)

router.get('/filter', authMiddleware, filterPhotos)

router.get('/scene/:type', authMiddleware, getByScene)

router.get('/top', authMiddleware, getTopPhotos)

router.get('/faces', authMiddleware, getPhotosWithFaces)

router.get('/flagged', authMiddleware, getFlaggedPhotos)

router.get('/search', authMiddleware, searchPhotos)

router.delete('/:id', authMiddleware, deletePhoto)

router.put('/:id/metadata', authMiddleware, updatePhotoMetadata)


module.exports = router