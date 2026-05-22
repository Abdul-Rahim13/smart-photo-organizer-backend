const fs = require('fs');
const path = require('path');
// FIXED: Correct path to models (going up 2 levels from controller/photoController/)
const photoModel = require('../../models/Photos');

exports.uploadPhoto = async (req, res) => {
    try {
        let uploadedFiles = [];
        if (req.files && Array.isArray(req.files)) {
            uploadedFiles = req.files;
        } else if (req.file) {
            uploadedFiles = [req.file];
        }

        if (uploadedFiles.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No files detected"
            });
        }

        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication failed"
            });
        }

        const photos = uploadedFiles.map(file => {
            let targetCategory = "General";
            const receivedCategory = req.body.sceneCategory || req.body.category;
            
            if (receivedCategory) {
                const normalized = receivedCategory.trim().toLowerCase();
                if (normalized === 'party') targetCategory = 'Party';
                else if (normalized === 'event' || normalized === 'events') targetCategory = 'Event';
                else if (normalized === 'trip' || normalized === 'tour') targetCategory = 'Trip';
            }

            const realFaceCount = req.body.faceCount ? parseInt(req.body.faceCount, 10) : 1;
            const realQuality = req.body.qualityScore ? parseInt(req.body.qualityScore, 10) : 85;

            let parsedTags = ['Live_DB_Upload'];
            if (req.body.tags) {
                try {
                    const incomingTags = typeof req.body.tags === 'string' ? JSON.parse(req.body.tags) : req.body.tags;
                    if (Array.isArray(incomingTags)) {
                        parsedTags = [...new Set([...parsedTags, ...incomingTags])];
                    }
                } catch (e) {
                    parsedTags.push(String(req.body.tags));
                }
            }

            return {
                imageUrl: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
                format: file.mimetype || 'image/jpeg',
                size: file.size || 0,
                user: req.user.id,
                sceneCategory: targetCategory,
                category: targetCategory,
                faceCount: realFaceCount,
                qualityScore: realQuality,
                isFlagged: realQuality < 30,
                tags: parsedTags
            };
        });

        const savedPhotos = await photoModel.insertMany(photos);

        return res.status(201).json({
            success: true,
            message: "Images uploaded successfully",
            photo: savedPhotos[0],
            data: savedPhotos
        });

    } catch (error) {
        console.error("Upload error:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getAllPhotos = async (req, res) => {
    try {
        const photos = await photoModel.find({ user: req.user.id }).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data: photos });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.getPhotoById = async (req, res) => {
    try {
        const photo = await photoModel.findOne({
            _id: req.params.id,
            user: req.user.id
        });
        if (!photo) {
            return res.status(404).json({ success: false, message: "Photo not found" });
        }
        res.json({ success: true, data: photo });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updatePhoto = async (req, res) => {
    try {
        const { sceneCategory, environment, socialGroup, tags, title } = req.body;
        const photo = await photoModel.findOne({ _id: req.params.id, user: req.user.id });
        
        if (!photo) {
            return res.status(404).json({ success: false, message: "Photo not found" });
        }

        if (sceneCategory) photo.sceneCategory = sceneCategory;
        if (environment) photo.environment = environment;
        if (socialGroup) photo.socialGroup = socialGroup;
        if (tags) photo.tags = tags;
        if (title) photo.title = title;

        await photo.save();
        res.json({ success: true, data: photo });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deletePhoto = async (req, res) => {
    try {
        const photo = await photoModel.findOne({ _id: req.params.id, user: req.user.id });
        if (!photo) {
            return res.status(404).json({ success: false, message: "Photo not found" });
        }

        const filePath = path.join(__dirname, '../../uploads', path.basename(photo.imageUrl));
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await photoModel.findByIdAndDelete(req.params.id);
        return res.status(200).json({ success: true, message: "Photo deleted successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.filterPhotos = async (req, res) => {
    try {
        const { scene, minFaces, minQuality, tag } = req.query;
        let filter = { user: req.user.id };

        if (scene) filter.sceneCategory = scene;
        if (minFaces) filter.faceCount = { $gte: Number(minFaces) };
        if (minQuality) filter.qualityScore = { $gte: Number(minQuality) };
        if (tag) filter.tags = { $in: [tag] };

        const photos = await photoModel.find(filter).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data: photos });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.getByScene = async (req, res) => {
    try {
        const photos = await photoModel.find({ user: req.user.id, sceneCategory: req.params.type }).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data: photos });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.getTopPhotos = async (req, res) => {
    try {
        const photos = await photoModel.find({ user: req.user.id, qualityScore: { $gte: 70 } }).sort({ qualityScore: -1 });
        return res.status(200).json({ success: true, data: photos });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.getPhotosWithFaces = async (req, res) => {
    try {
        const min = req.query.min || 1;
        const photos = await photoModel.find({ user: req.user.id, faceCount: { $gte: Number(min) } });
        return res.status(200).json({ success: true, data: photos });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.getFlaggedPhotos = async (req, res) => {
    try {
        const photos = await photoModel.find({ user: req.user.id, isFlagged: true });
        return res.status(200).json({ success: true, data: photos });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.searchPhotos = async (req, res) => {
    try {
        const { tag } = req.query;
        const photos = await photoModel.find({ user: req.user.id, tags: { $in: [tag] } });
        return res.status(200).json({ success: true, data: photos });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.updatePhotoMetadata = async (req, res) => {
    try {
        const { sceneCategory, faceCount, qualityScore, tags } = req.body;
        const photo = await photoModel.findOne({ _id: req.params.id, user: req.user.id });

        if (!photo) {
            return res.status(404).json({ success: false, message: "Photo not found" });
        }

        if (sceneCategory) photo.sceneCategory = sceneCategory;
        if (faceCount !== undefined) photo.faceCount = Number(faceCount);
        if (qualityScore !== undefined) photo.qualityScore = Number(qualityScore);
        if (tags) photo.tags = tags;

        photo.isFlagged = photo.qualityScore < 30;
        await photo.save();

        return res.status(200).json({ success: true, data: photo });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Aliases for route compatibility
exports.uploadPhotos = exports.uploadPhoto;
exports.getPhotosByScene = exports.getByScene;
exports.getPhotosByFaceCount = exports.getPhotosWithFaces;
exports.getTopRatedPhotos = exports.getTopPhotos;

// Toggle star/favorite
exports.toggleStar = async (req, res) => {
    try {
        const photo = await photoModel.findOne({ _id: req.params.id, user: req.user.id });
        if (!photo) {
            return res.status(404).json({ success: false, message: "Photo not found" });
        }
        photo.isStarred = !photo.isStarred;
        await photo.save();
        res.json({ success: true, data: photo });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Trash functions
exports.moveToTrash = async (req, res) => {
    try {
        const { photoIds } = req.body;
        if (!photoIds || !Array.isArray(photoIds)) {
            return res.status(400).json({ success: false, message: "photoIds array is required" });
        }

        const result = await photoModel.updateMany(
            { _id: { $in: photoIds }, user: req.user.id },
            { isTrashed: true, trashedAt: new Date() }
        );

        const photos = await photoModel.find({ _id: { $in: photoIds }, user: req.user.id });
        res.json({ success: true, message: `${result.modifiedCount} photos moved to trash`, data: photos });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.restoreFromTrash = async (req, res) => {
    try {
        const { photoIds } = req.body;
        if (!photoIds || !Array.isArray(photoIds)) {
            return res.status(400).json({ success: false, message: "photoIds array is required" });
        }

        const result = await photoModel.updateMany(
            { _id: { $in: photoIds }, user: req.user.id, isTrashed: true },
            { isTrashed: false, trashedAt: null }
        );

        const photos = await photoModel.find({ _id: { $in: photoIds }, user: req.user.id });
        res.json({ success: true, message: `${result.modifiedCount} photos restored`, data: photos });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getTrashedPhotos = async (req, res) => {
    try {
        const photos = await photoModel.find({ user: req.user.id, isTrashed: true }).sort({ trashedAt: -1 });
        const photosWithDays = photos.map(photo => {
            const daysInTrash = photo.trashedAt ? Math.floor((Date.now() - new Date(photo.trashedAt)) / (1000 * 60 * 60 * 24)) : 0;
            const photoObj = photo.toObject();
            photoObj.daysInTrash = daysInTrash;
            photoObj.id = photoObj._id;
            return photoObj;
        });
        res.json({ success: true, data: photosWithDays });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.permanentlyDeletePhotos = async (req, res) => {
    try {
        const { photoIds } = req.body;
        if (!photoIds || !Array.isArray(photoIds)) {
            return res.status(400).json({ success: false, message: "photoIds array is required" });
        }

        const result = await photoModel.deleteMany({ _id: { $in: photoIds }, user: req.user.id, isTrashed: true });
        res.json({ success: true, message: `${result.deletedCount} photos permanently deleted`, deletedIds: photoIds });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.autoDeleteExpiredTrash = async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const result = await photoModel.deleteMany({ user: req.user.id, isTrashed: true, trashedAt: { $lt: thirtyDaysAgo } });
        res.json({ success: true, message: `${result.deletedCount} expired photos auto-deleted`, deletedCount: result.deletedCount });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};