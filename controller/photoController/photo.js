const photoModel = require('../../models/Photos/Photo')


exports.uploadPhoto = async (req, res) => {
    try {
        const files = req.files

        if(!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No files uploaded"
            });
        }

        const photos = files.map(file => ({
            imageUrl: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
            format: file.mimetype,
            size: file.size,
            user: req.user?.id || null
        }))

        const savedPhotos = await photoModel.insertMany(photos)
        return res.status(201).json({
            success: true,
            message: "Images uploaded successfully",
            data: savedPhotos
        });
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Upload failed",
            error: error.message
        });   
    }
}