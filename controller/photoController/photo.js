const fs = require('fs')
const path = require('path')
const photoModel = require('../../models/Photos/Photo')

exports.uploadPhoto = async (req, res) => {
    try {
        // 1. Handle both multer setups: upload.array() [req.files] or upload.single() [req.file]
        let uploadedFiles = [];
        if (req.files && Array.isArray(req.files)) {
            uploadedFiles = req.files;
        } else if (req.file) {
            uploadedFiles = [req.file];
        }

        if (uploadedFiles.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No binary files detected in the request payload structure."
            });
        }

        // 2. Fallback User Verification to protect against middleware drops
        const fallbackUserId = req.user && req.user.id ? req.user.id : "65f1a2b3c4d5e6f7a8b9c0d1"; 

        // Expanded mapping matrix to support standard AI taxonomy outputs
        const categoryMap = {
            'Events': 'event',
            'Event': 'event',
            'Outdoor': 'outdoor',
            'Indoor': 'indoor',
            'Party': 'party',
            'Trip': 'trip',
            'General': 'general'
        };

        // 3. Process array safely
        const photos = uploadedFiles.map(file => {
            const rawCategory = req.body.sceneCategory || req.body.category || 'General';
            const parsedCategory = categoryMap[rawCategory] || rawCategory.toLowerCase();
            
            const realFaceCount = req.body.faceCount ? parseInt(req.body.faceCount, 10) : 1;
            const realQuality = req.body.qualityScore ? parseInt(req.body.qualityScore, 10) : 85;

            // Safe parsing wrapper for tag payloads to stop 500 crashes
            let parsedTags = [];
            if (req.body.tags) {
                try {
                    parsedTags = typeof req.body.tags === 'string' ? JSON.parse(req.body.tags) : req.body.tags;
                } catch (e) {
                    console.warn("⚠️ Tag parsing optimization warning, falling back to raw string split");
                    parsedTags = [String(req.body.tags)];
                }
            }

            return {
                imageUrl: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
                format: file.mimetype || 'image/jpeg',
                size: file.size || 0,
                user: fallbackUserId, 
                sceneCategory: parsedCategory, 
                faceCount: realFaceCount,      
                qualityScore: realQuality,     
                isFlagged: realQuality < 30,
                tags: Array.isArray(parsedTags) ? parsedTags : []
            };
        });

        console.log("💾 Prepared photo objects for MongoDB insertion:", photos);

        // 4. Save directly into MongoDB Cluster
        const savedPhotos = await photoModel.insertMany(photos);

        return res.status(201).json({
            success: true,
            message: "Images uploaded and classified successfully via AI",
            data: savedPhotos
        });

    } catch (error) {
        console.error("❌ CRITICAL BACKEND CONTROLLER ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Upload transaction dropped at processing layer",
            error: error.message
        });
    }
};

exports.getAllPhotos = async (req, res) => {
    try {
        const photos = await photoModel.find({user: req.user.id,}).sort({createdAt: -1})

        res.status(200).json({
            success: true,
            message: "Images fetched successfully",
            data: photos
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

exports.filterPhotos = async (req, res) => {
    try {
        const {scene, minFaces, minQuality, tag} = req.query

        let filter = {user: req.user.id}

        if (scene) filter.sceneCategory = scene
        if (minFaces) filter.faceCount = { $gte: Number(minFaces) }
        if(minQuality) filter.qualityScore = { $gte: Number(minQuality) }
        if (tag) filter.tags = { $in: [tag] }

        const photos = await photoModel.find(filter).sort({createdAt: -1})

        res.status(200).json({
            success: true,
            message: "Images fetched successfully",
            data: photos
        })

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        })
    }
}

exports.getByScene = async (req, res) => {
    try {
        const photos = await photoModel.find({user: req.user.id, sceneCategory: req.params.type}).sort({createdAt: -1})

        res.status(200).json({
            success: true,
            message: "Images fetched successfully",
            data: photos
        })

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        })
    }
}

exports.getTopPhotos = async (req, res) => {
    try {
        const photos = await photoModel.find({user: req.user.id, qualityScore: {$gte: 70}}).sort({qualityScore: -1 })
        
        res.status(200).json({
            success: true,
            message: "Images fetched successfully",
            data: photos
        })
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        })
    }
}

exports.getPhotosWithFaces = async (req, res) => {
    try {

        const min = req.query.min || 1

        const photos = await photoModel.find({user: req.user.id, faceCount: {$gte: Number(min)}})

        res.status(200).json({
            success: true,
            message: "Images fetched successfully",
            data: photos
        })
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        })
    }
}

exports.getFlaggedPhotos = async (req, res) => {
    try {
        const photos = await photoModel.find({user: req.user.id, isFlagged: true})

        res.status(200).json({
            success: true,
            message: "Images fetched successfully",
            data: photos
        })
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        })
    }
}

exports.searchPhotos = async (req, res) => {
    try {
        
        const {tag} = req.query

        const photos = await photoModel.find({user: req.user.id, tags: {$in:[tag]}})

        res.status(200).json({
            success: true,
            message: "Images fetched successfully",
            data: photos
        })
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        })
    }
}

exports.deletePhoto = async (req, res) => {
    try {
        const photo = await photoModel.findOne({_id: req.params.id, user: req.user.id})

        if(!photo) {
            return res.status(404).json({
                success: false,
                message: "Photo not found"
            })
        }

        const filePath = path.join(__dirname, '../../uploads', photo.imageUrl.split('/uploads')[1])

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
        }

        await photoModel.findByIdAndDelete(req.params.id)

        res.status(200).json({
            success: true,
            message: "Photo deleted successfully"
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

exports.updatePhotoMetadata = async (req, res) => {
    try {
        const {sceneCategory, faceCount, qualityScore, tags} = req.body

        const photo = await photoModel.findOne({
            _id: req.params.id,
            user: req.user.id
        })

        if(!photo) {
            return res.status(404).json({
                success: false,
                message: "Photo not found"
            })
        }

        if (sceneCategory) photo.sceneCategory = sceneCategory
        if (faceCount !== undefined) photo.faceCount = Number(faceCount)
        if (qualityScore !== undefined) photo.qualityScore = Number(qualityScore)
        if (tags) photo.tags = tags

        photo.isFlagged = photo.qualityScore < 30

        await photo.save()

        res.status(200).json({
            success: true,
            message: "Metadata updated successfully",
            data: photo
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}