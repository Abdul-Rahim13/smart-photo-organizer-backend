const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../middleware/AuthMiddleware');
const { createAlbum, getUserAlbums, getSingleAlbum, addPhotosToAlbum, removePhotosFromAlbum,updateAlbum,deleteAlbum,  toggleFavoriteAlbum } = require('../../controller/albumController/album');



router.post('/', authMiddleware, createAlbum);

router.get('/', authMiddleware, getUserAlbums);

router.get('/:id', authMiddleware, getSingleAlbum);

router.put('/:id/add-photos', authMiddleware, addPhotosToAlbum);

router.put('/:id/remove-photos', authMiddleware, removePhotosFromAlbum);

router.put('/:id', authMiddleware, updateAlbum);

router.delete('/:id', authMiddleware, deleteAlbum);

router.put('/:id/favorite', authMiddleware, toggleFavoriteAlbum);

module.exports = router;