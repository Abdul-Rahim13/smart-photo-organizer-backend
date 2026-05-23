const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloud");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "FYP",
    format: async (req, file) => {
      const ext = file.originalname.split('.').pop().toLowerCase();
      return ['jpg', 'jpeg', 'png'].includes(ext) ? ext : 'jpg';
    },
    public_id: (req, file) => `${Date.now()}-${file.originalname.replace(/\s+/g, "-").split('.')[0]}`
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

module.exports = upload;