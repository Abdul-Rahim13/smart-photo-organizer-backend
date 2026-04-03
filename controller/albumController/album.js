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
        
    } catch (error) {
        
    }
} 

exports.getSingleAlbum = async (req, res) => {
    try {
        
    } catch (error) {
        
    }
} 

exports.addPhotosToAlbum = async (req, res) => {
    try {
        
    } catch (error) {
        
    }
}

exports.removePhotosFromAlbum = async (req, res) => {
    try {
        
    } catch (error) {
        
    }
}

exports.updateAlbum = async (req, res) => {
    try {
        
    } catch (error) {
        
    }
}

exports.deleteAlbum = async (req, res) => {
    try {
        
    } catch (error) {
        
    }
}