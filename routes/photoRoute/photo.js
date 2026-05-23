const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../middleware/AuthMiddleware');
const upload = require('../../middleware/uploadMiddleware');

const {
    uploadPhoto,
    getAllPhotos,
    getPhotoById,
    updatePhoto,
    deletePhoto,
    getPhotosByScene,
    getPhotosByFaceCount,
    getFlaggedPhotos,
    searchPhotos,
    getTopRatedPhotos,
    getPhotosWithFaces,
    filterPhotos,
    toggleStar,
    moveToTrash,
    restoreFromTrash,
    getTrashedPhotos,
    permanentlyDeletePhotos,
    autoDeleteExpiredTrash
} = require('../../controller/photoController/photo');

router.use(authMiddleware);

// Upload - specific path first
router.post('/upload', upload.array('photos', 50), uploadPhoto);

// Trash system
router.put('/trash', moveToTrash);
router.put('/restore', restoreFromTrash);
router.get('/trash', getTrashedPhotos);
router.delete('/permanent', permanentlyDeletePhotos);
router.delete('/auto-delete-expired', autoDeleteExpiredTrash);

// Filters with specific params (place BEFORE generic /:id routes)
router.get('/filter', filterPhotos);
router.get('/search', searchPhotos);
router.get('/top', getTopRatedPhotos);
router.get('/faces', getPhotosWithFaces);
router.get('/flagged', getFlaggedPhotos);
router.get('/scene/:scene', getPhotosByScene);
router.get('/face-count/:minFaces', getPhotosByFaceCount);

// Star - uses :id but is a PATCH method
router.patch('/:id/star', toggleStar);

// CRUD - generic routes LAST
router.route('/')
    .get(getAllPhotos);

router.route('/:id')
    .get(getPhotoById)
    .put(updatePhoto)
    .delete(deletePhoto);

module.exports = router;