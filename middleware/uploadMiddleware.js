const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Guarantee directory footprint exists before file stream buffers
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Ensure the 'uploads' folder exists in your backend root
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /image\/jpeg|image\/jpg|image\/png/;
    
    if (allowedTypes.test(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only images (JPEG/JPG/PNG) are supported!'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // Bumped up to 10MB safely for high-res images
});

module.exports = upload;