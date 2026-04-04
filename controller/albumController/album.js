const albumModel = require('../../models/Album/Album')

exports.createAlbum = async (req, res) => {
    try {
        const {title, description} = req.body

        const album = await albumModel.create({
            user: req.user.id,
            title, 
            description
        })

        res.status(201).json({
            success: true,
            data: album
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
} 

exports.getUserAlbums = async (req, res) => {
    try {
        const albums = await albumModel.find({user: req.user.id}).populate('coverPhoto', 'imageUrl').sort({createdAt: -1})

        res.json({
            success: true,
            data: albums
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
} 

exports.getSingleAlbum = async (req, res) => {
    try {
        const album = await albumModel.findOne({ _id: req.params.id, user: req.user.id}).populate('photos coverPhoto' )

        if (!album) {
            return res.status(404).json({
                success: false,
                message: "Album not found"
            })
        }

        res.json({
            success: true,
            data: album
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
} 

exports.addPhotosToAlbum = async (req, res) => {
    try {
        const {photoIds} = req.body

        const album = await albumModel.findOne({_id: req.params.id, user: req.user.id})

        if(!album){
            return res.status(404).json({
                success: false,
                message: "Album not found"
            })
        }

        // Add new photos (avoid duplicates)
        album.photos = [...new Set([...album.photos, ...photoIds])]

        if(!album.coverPhoto && photoIds.length > 0) {
            album.coverPhoto = photoIds[0]
        }

        await album.save()

        res.json({
            success: true,
            message: "Photos added to album",
            data: album
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

exports.removePhotosFromAlbum = async (req, res) => {
    try {
        const { photoIds } = req.body

        const album = await albumModel.findOne({
            _id: req.params.id,
            user: req.user.id
        })

        if (!album) {
            return res.status(404).json({
                success: false,
                message: "Album not found"
            })
        }

        album.photos = album.photos.filter(
            photo => !photoIds.includes(photo.toString())
        )

        await album.save()

        res.json({
            success: true,
            message: "Photos removed from album",
            data: album
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

exports.updateAlbum = async (req, res) => {
    try {
        const { title, description } = req.body

        const album = await albumModel.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { title, description },
            { new: true }
        )

        if (!album) {
            return res.status(404).json({
                success: false,
                message: "Album not found"
            })
        }

        res.json({
            success: true,
            data: album
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

exports.deleteAlbum = async (req, res) => {
    try {
        const album = await albumModel.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id
        })

        if (!album) {
            return res.status(404).json({
                success: false,
                message: "Album not found"
            })
        }

        res.json({
            success: true,
            message: "Album deleted successfully"
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}