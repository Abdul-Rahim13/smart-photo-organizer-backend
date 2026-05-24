const albumModel = require('../../models/Album/Album')

exports.createAlbum = async (req, res) => {
    try {
        const { title, description, type, tier, category, parentFolderId, photos } = req.body;
        
        console.log("📦 Creating album with:", { title, description, type, tier, category, parentFolderId, photosCount: photos?.length });
        
        const album = await albumModel.create({
            user: req.user.id,
            title,
            description,
            type: type || "private",
            tier: tier || "Root",
            category: category || "general",
            parentFolderId: parentFolderId || null,
            photos: photos || [],  // ← THIS WAS MISSING! Now saving photos
        });
        
        // Populate the photos before sending response
        const populatedAlbum = await albumModel.findById(album._id).populate('photos');
        
        res.status(201).json({ 
            success: true, 
            data: populatedAlbum 
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "You already have an album with this title"
            });
        }
        console.error("Create album error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
}

exports.getUserAlbums = async (req, res) => {
    try {
        const albums = await albumModel.find({ user: req.user.id })
            .populate('photos')  // ← POPULATE PHOTOS
            .populate('coverPhoto')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: albums
        });
    } catch (error) {
        console.error("Get albums error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

exports.getSingleAlbum = async (req, res) => {
    try {
        const album = await albumModel.findOne({ _id: req.params.id, user: req.user.id })
            .populate('photos')
            .populate('coverPhoto');

        if (!album) {
            return res.status(404).json({
                success: false,
                message: "Album not found"
            });
        }

        res.json({
            success: true,
            data: album
        });
    } catch (error) {
        console.error("Get single album error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

exports.addPhotosToAlbum = async (req, res) => {
    try {
        const { photoIds } = req.body;

        const album = await albumModel.findOne({ _id: req.params.id, user: req.user.id });

        if (!album) {
            return res.status(404).json({
                success: false,
                message: "Album not found"
            });
        }

        // Add new photos (avoid duplicates)
        album.photos = [...new Set([...album.photos.map(id => id.toString()), ...photoIds])];

        if (!album.coverPhoto && photoIds.length > 0) {
            album.coverPhoto = photoIds[0];
        }

        await album.save();
        
        // Populate and return
        const populatedAlbum = await albumModel.findById(album._id).populate('photos');

        res.json({
            success: true,
            message: "Photos added to album",
            data: populatedAlbum
        });
    } catch (error) {
        console.error("Add photos error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

exports.removePhotosFromAlbum = async (req, res) => {
    try {
        const { photoIds } = req.body;

        const album = await albumModel.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!album) {
            return res.status(404).json({
                success: false,
                message: "Album not found"
            });
        }

        album.photos = album.photos.filter(
            photo => !photoIds.includes(photo.toString())
        );

        await album.save();
        
        const populatedAlbum = await albumModel.findById(album._id).populate('photos');

        res.json({
            success: true,
            message: "Photos removed from album",
            data: populatedAlbum
        });
    } catch (error) {
        console.error("Remove photos error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

exports.updateAlbum = async (req, res) => {
    try {
        const { title, description, type, tier, category, parentFolderId } = req.body;

        const album = await albumModel.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { 
                title, 
                description,
                type: type || "private",
                tier: tier || "Root",
                category: category || "general",
                parentFolderId: parentFolderId || null
            },
            { new: true }
        ).populate('photos');

        if (!album) {
            return res.status(404).json({
                success: false,
                message: "Album not found"
            });
        }

        res.json({
            success: true,
            data: album
        });
    } catch (error) {
        console.error("Update album error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

exports.deleteAlbum = async (req, res) => {
    try {
        const album = await albumModel.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id
        });

        if (!album) {
            return res.status(404).json({
                success: false,
                message: "Album not found"
            });
        }

        res.json({
            success: true,
            message: "Album deleted successfully"
        });
    } catch (error) {
        console.error("Delete album error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

// Toggle favorite album
exports.toggleFavoriteAlbum = async (req, res) => {
    try {
        const album = await albumModel.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!album) {
            return res.status(404).json({
                success: false,
                message: "Album not found"
            });
        }

        // Toggle the favorite status
        album.isFavorite = !album.isFavorite;
        await album.save();

        // Populate and return
        const populatedAlbum = await albumModel.findById(album._id).populate('photos');

        res.json({
            success: true,
            message: album.isFavorite ? "Album added to favorites" : "Album removed from favorites",
            data: populatedAlbum
        });
    } catch (error) {
        console.error("Toggle favorite error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};