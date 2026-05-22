const fs = require('fs');
const path = require('path');
const photoModel = require('../../models/Photos/Photo');

exports.uploadPhoto = async (req, res) => {
    try {
        // 1. Safe extraction array for handling both array and single file uploads
        let uploadedFiles = [];
        if (req.files && Array.isArray(req.files)) {
            uploadedFiles = req.files;
        } else if (req.file) {
            uploadedFiles = [req.file];
        }

        if (uploadedFiles.length === 0) {
            console.error("❌ Multer Configuration Breakdown: No files found in request pipeline.");
            return res.status(400).json({
                success: false,
                message: "No binary files detected in the request payload structure."
            });
        }

        // 2. Validate user identity object mapping properties
        if (!req.user || !req.user.id) {
            console.error("❌ Authorization Error: req.user.id is empty or missing.");
            return res.status(401).json({
                success: false,
                message: "Authentication failed. User missing from request scope."
            });
        }

        // 3. Map file records securely
        const photos = uploadedFiles.map(file => {
            // Preserve proper PascalCase names so your frontend taxonomy matches perfectly!
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

            // Safe parsing wrapper for stringified arrays sent from frontend FormData
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
                sceneCategory: targetCategory, // Fixed string formatting
                category: targetCategory,      // Injects both keys for cross-compatibility
                faceCount: realFaceCount,
                qualityScore: realQuality,
                isFlagged: realQuality < 30,
                tags: parsedTags
            };
        });

        console.log("💾 Executing insertMany to MongoDB cluster instance:", photos);

        // 4. Atomic Database Insert Statement
        const savedPhotos = await photoModel.insertMany(photos);

        return res.status(201).json({
            success: true,
            message: "Images uploaded and classified successfully via AI",
            photo: savedPhotos[0], // Return single photo reference structure back to client
            data: savedPhotos
        });

    } catch (error) {
        console.error("❌ CRITICAL BACKEND CONTROLLER EXCEPTION:", error);
        return res.status(500).json({
            success: false,
            message: "Upload transaction dropped at processing layer",
            error: error.message
        });
    }
};

// ── EXTENDED CRITICAL FETCH API ADAPTERS ──────────────────────────────────
exports.getAllPhotos = async (req, res) => {
    try {
        const photos = await photoModel.find({ user: req.user.id }).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, message: "Images fetched successfully", data: photos });
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
        return res.status(200).json({ success: true, message: "Images fetched successfully", data: photos });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.getByScene = async (req, res) => {
    try {
        const photos = await photoModel.find({ user: req.user.id, sceneCategory: req.params.type }).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, message: "Images fetched successfully", data: photos });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.getTopPhotos = async (req, res) => {
    try {
        const photos = await photoModel.find({ user: req.user.id, qualityScore: { $gte: 70 } }).sort({ qualityScore: -1 });
        return res.status(200).json({ success: true, message: "Images fetched successfully", data: photos });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.getPhotosWithFaces = async (req, res) => {
    try {
        const min = req.query.min || 1;
        const photos = await photoModel.find({ user: req.user.id, faceCount: { $gte: Number(min) } });
        return res.status(200).json({ success: true, message: "Images fetched successfully", data: photos });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.getFlaggedPhotos = async (req, res) => {
    try {
        const photos = await photoModel.find({ user: req.user.id, isFlagged: true });
        return res.status(200).json({ success: true, message: "Images fetched successfully", data: photos });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.searchPhotos = async (req, res) => {
    try {
        const { tag } = req.query;
        const photos = await photoModel.find({ user: req.user.id, tags: { $in: [tag] } });
        return res.status(200).json({ success: true, message: "Images fetched successfully", data: photos });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.deletePhoto = async (req, res) => {
    try {
        const photo = await photoModel.findOne({ _id: req.params.id, user: req.user.id });
        if (!photo) {
            return res.status(404).json({ success: false, message: "Photo not found" });
        }

        const filePath = path.join(__dirname, '../../uploads', photo.imageUrl.split('/uploads')[1]);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await photoModel.findByIdAndDelete(req.params.id);
        return res.status(200).json({ success: true, message: "Photo deleted successfully" });
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

        return res.status(200).json({ success: true, message: "Metadata updated successfully", data: photo });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};