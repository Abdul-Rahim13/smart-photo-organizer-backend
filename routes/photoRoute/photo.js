// routes/photoRoute/photo.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../middleware/AuthMiddleware');
const {
    uploadPhotos,
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
const upload = require('../../config/multer');

// Protect all routes
router.use(authMiddleware);

// Upload route
router.post('/upload', upload.array('photos', 50), uploadPhotos);

// Trash routes (add these BEFORE the :id route)
router.put('/trash', moveToTrash);
router.put('/restore', restoreFromTrash);
router.get('/trash', getTrashedPhotos);
router.delete('/permanent', permanentlyDeletePhotos);
router.delete('/auto-delete-expired', autoDeleteExpiredTrash);

// Filter and search routes
router.get('/filter', filterPhotos);
router.get('/search', searchPhotos);
router.get('/top', getTopRatedPhotos);
router.get('/faces', getPhotosWithFaces);
router.get('/flagged', getFlaggedPhotos);
router.get('/scene/:scene', getPhotosByScene);
router.get('/face-count/:minFaces', getPhotosByFaceCount);

// Star/Favorite route
router.patch('/:id/star', toggleStar);

// CRUD routes (keep these at the end)
router.route('/')
    .get(getAllPhotos);

router.route('/:id')
    .get(getPhotoById)
    .put(updatePhoto)
    .delete(deletePhoto);

module.exports = router;