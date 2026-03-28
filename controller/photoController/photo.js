const photoModel = require('../../models/Photos/Photo')

exports.uploadPhoto = async (req, res) => {
    try {
        const files = req.files
        // Dummy -> reomve after Frontend AI model Training
        const scenes = ['indoor', 'outdoor', 'event']
        const randomScene = scenes[Math.floor(Math.random() * scenes.length)]


        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No files uploaded"
            })
        }

        const photos = files.map(file => ({
            
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
        }))

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

        res.status(201).json({
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
        const {scence, minFaces, minQulaity, tag} = req.query

        let filter = {user: req.user.id}

        if (scence) filter.sceneCategory = scence
        if (minFaces) filter.faceCount = minFaces
        if(minQulaity) filter.qualityScore = minQulaity
        if (tag) filter.tags = tag

        const photos = await photoModel.find(filter).sort({createdAt: -1})

        res.status(201).json({
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

        res.status(201).json({
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
        
    } catch (error) {
        
    }
}

exports.getPhotosWithFaces = async (req, res) => {
    try {
        
    } catch (error) {
        
    }
}

exports.getFlaggedPhotos = async (req, res) => {
    try {
        
    } catch (error) {
        
    }
}

exports.searchPhotos = async (req, res) => {
    try {
        
    } catch (error) {
        
    }
}