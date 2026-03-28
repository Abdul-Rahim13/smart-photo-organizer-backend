const multer = require('multer')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/')
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`)
    }
})

const fileFilter = (req, file, cb) => {
    const allowedTypes = /image\/jpeg|image\/jpg|image\/png/

    if (allowedTypes.test(file.mimetype)) {
        cb(null, true)
    } else {
        cb(new Error('Only images allowed'), false)
    }
}

const fil = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
})

module.exports = upload