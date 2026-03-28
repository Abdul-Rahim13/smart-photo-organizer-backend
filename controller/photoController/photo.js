const photoModel = require('../../models/Photos/Photo')

exports.uploadPhoto = async (req, res) => {
    try {
        const files = req.files
        // Dummy -> reomve after Frontend AI model Training
        const scenes = ['indoor', 'outdoor', 'event']

        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No files uploaded"
            })
        }

        const photos = files.map(file => {
             // Dummy -> reomve after Frontend AI model Training
            const randomScene = scenes[Math.floor(Math.random() * scenes.length)]
            
            return {
                imageUrl: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
                format: file.mimetype,
                size: file.size,
                user: req.user.id,
                // Dummy -> reomve after Frontend AI model Training
                sceneCategory: randomScene,
                faceCount: Math.floor(Math.random() * 5),
                qualityScore: Math.floor(Math.random() * 100),
                isFlagged: false,
                tags: []
            }
            
        })

        const savedPhotos = await photoModel.insertMany(photos)

        res.status(201).json({
            success: true,
            message: "Images uploaded successfully",
            data: savedPhotos
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Upload failed",
            error: error.message
        })
    }
}

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