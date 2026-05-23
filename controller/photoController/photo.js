const mongoose = require("mongoose");
const photoModel = require("../../models/Photos/Photo");
const cloudinary = require("../../config/cloud");
const analyzeWithHuggingFace = require('../../service/aiAnalysis');

/* ---------------- HELPERS ---------------- */

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const normalizeTags = (tags) => {
    if (!tags) return ["Live_DB_Upload"];

    try {
        const parsed = typeof tags === "string" ? JSON.parse(tags) : tags;

        if (Array.isArray(parsed)) {
            return ["Live_DB_Upload", ...parsed.map(String)];
        }

        return ["Live_DB_Upload", String(tags)];
    } catch {
        return ["Live_DB_Upload", String(tags)];
    }
};

exports.uploadPhoto = async (req, res) => {
  try {
    console.log('=== UPLOAD START ===');
    console.log('HUGGINGFACE_API_KEY exists?', !!process.env.HUGGINGFACE_API_KEY);
    console.log('Files:', req.files?.length);
    
    if (!req.files || !req.files.length) {
      return res.status(400).json({ success: false, message: "No files uploaded" });
    }
    
    const photos = [];
    
    for (const file of req.files) {
      console.log(`\n📷 Processing: ${file.originalname}`);
      console.log(`   Cloudinary URL: ${file.path}`);
      
      // Run AI analysis
      let aiAnalysis = {
        sceneCategory: 'General',
        environment: 'Indoor',
        socialGroup: 'Solo',
        faceCount: 1,
        qualityScore: 85,
        isFlagged: false
      };
      
      // Download image from Cloudinary for AI analysis
      try {
        console.log('   🔍 Downloading image for AI analysis...');
        const imageResponse = await axios.get(file.path, { 
          responseType: 'arraybuffer',
          timeout: 30000
        });
        const imageBuffer = Buffer.from(imageResponse.data);
        
        console.log('   🧠 Running Hugging Face AI...');
        aiAnalysis = await analyzeWithHuggingFace(imageBuffer);
        console.log(`   ✅ AI Result: ${aiAnalysis.sceneCategory} | ${aiAnalysis.environment} | ${aiAnalysis.socialGroup}`);
        
      } catch (aiError) {
        console.error(`   ⚠️ AI Analysis failed: ${aiError.message}`);
        console.log('   → Using default values');
      }
      
      photos.push({
        imageUrl: file.path,
        publicId: file.filename,
        user: req.user.id,
        sceneCategory: aiAnalysis.sceneCategory,
        category: aiAnalysis.sceneCategory,
        environment: aiAnalysis.environment,
        socialGroup: aiAnalysis.socialGroup,
        faceCount: aiAnalysis.faceCount,
        qualityScore: aiAnalysis.qualityScore,
        isFlagged: aiAnalysis.isFlagged,
        tags: normalizeTags(req.body.tags),
        title: req.body.title || file.originalname.split('.')[0],
        isStarred: false,
        isTrashed: false,
        trashedAt: null
      });
    }
    
    const saved = await photoModel.insertMany(photos);
    console.log(`\n✅ Saved ${saved.length} photos with AI analysis`);
    
    res.status(201).json({ 
      success: true, 
      data: saved,
      aiAnalyzed: !!process.env.HUGGINGFACE_API_KEY
    });
    
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
/* ---------------- GET ALL ---------------- */
exports.getAllPhotos = async (req, res) => {
    try {
        const photos = await photoModel.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json({ success: true, data: photos });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ---------------- GET BY ID ---------------- */
exports.getPhotoById = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid ID" });
        }

        const photo = await photoModel.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!photo) {
            return res.status(404).json({ success: false, message: "Photo not found" });
        }

        res.json({ success: true, data: photo });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ---------------- UPDATE ---------------- */
exports.updatePhoto = async (req, res) => {
    try {
        const photo = await photoModel.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!photo) {
            return res.status(404).json({ success: false, message: "Photo not found" });
        }

        if (req.body.sceneCategory) {
            const validScenes = ['Party', 'Event', 'Trip', 'General'];
            if (!validScenes.includes(req.body.sceneCategory)) {
                return res.status(400).json({ success: false, message: "Invalid scene category" });
            }
            photo.sceneCategory = req.body.sceneCategory;
        }
        if (req.body.environment) photo.environment = req.body.environment;
        if (req.body.socialGroup) photo.socialGroup = req.body.socialGroup;
        if (req.body.title) photo.title = req.body.title;
        if (req.body.tags) photo.tags = normalizeTags(req.body.tags);

        await photo.save();

        res.json({ success: true, data: photo });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ---------------- DELETE ---------------- */
exports.deletePhoto = async (req, res) => {
    try {
        const photo = await photoModel.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!photo) {
            return res.status(404).json({ success: false, message: "Photo not found" });
        }

        if (photo.publicId) {
            await cloudinary.uploader.destroy(photo.publicId);
        }

        await photo.deleteOne();

        res.json({ success: true, message: "Photo deleted successfully" });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ---------------- FILTER ---------------- */
exports.filterPhotos = async (req, res) => {
    try {
        const filter = { user: req.user.id };

        if (req.query.scene) filter.sceneCategory = req.query.scene;

        if (req.query.minFaces && !isNaN(req.query.minFaces)) {
            filter.faceCount = { $gte: Number(req.query.minFaces) };
        }

        if (req.query.minQuality && !isNaN(req.query.minQuality)) {
            filter.qualityScore = { $gte: Number(req.query.minQuality) };
        }

        if (req.query.tag) {
            filter.tags = { $in: [req.query.tag] };
        }

        const photos = await photoModel.find(filter).sort({ createdAt: -1 });

        res.json({ success: true, data: photos });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ---------------- SEARCH ---------------- */
exports.searchPhotos = async (req, res) => {
    try {
        const { tag } = req.query;

        if (!tag) {
            return res.status(400).json({ success: false, message: "tag is required" });
        }

        const photos = await photoModel.find({
            user: req.user.id,
            tags: { $in: [tag] }
        });

        res.json({ success: true, data: photos });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ---------------- STAR ---------------- */
exports.toggleStar = async (req, res) => {
    try {
        const photo = await photoModel.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!photo) {
            return res.status(404).json({ success: false, message: "Photo not found" });
        }

        photo.isStarred = !photo.isStarred;
        await photo.save();

        res.json({ success: true, data: photo });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ---------------- TRASH ---------------- */
exports.moveToTrash = async (req, res) => {
    try {
        const { photoIds } = req.body;

        if (!Array.isArray(photoIds) || !photoIds.length) {
            return res.status(400).json({ success: false, message: "photoIds required" });
        }

        await photoModel.updateMany(
            { _id: { $in: photoIds }, user: req.user.id },
            { isTrashed: true, trashedAt: new Date() }
        );

        res.json({ success: true, message: "Moved to trash" });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ---------------- RESTORE ---------------- */
exports.restoreFromTrash = async (req, res) => {
    try {
        const { photoIds } = req.body;

        if (!Array.isArray(photoIds) || !photoIds.length) {
            return res.status(400).json({ success: false, message: "photoIds required" });
        }

        await photoModel.updateMany(
            { _id: { $in: photoIds }, user: req.user.id },
            { isTrashed: false, trashedAt: null }
        );

        res.json({ success: true, message: "Restored successfully" });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ---------------- TRASH LIST ---------------- */
exports.getTrashedPhotos = async (req, res) => {
    try {
        const photos = await photoModel.find({
            user: req.user.id,
            isTrashed: true
        }).sort({ trashedAt: -1 });

        res.json({ success: true, data: photos });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ---------------- PERMANENT DELETE ---------------- */
exports.permanentlyDeletePhotos = async (req, res) => {
    try {
        const { photoIds } = req.body;

        if (!Array.isArray(photoIds) || !photoIds.length) {
            return res.status(400).json({ success: false, message: "photoIds required" });
        }

        const photos = await photoModel.find({ _id: { $in: photoIds }, user: req.user.id });

        for (let photo of photos) {
            if (photo.publicId) {
                await cloudinary.uploader.destroy(photo.publicId);
            }
        }

        await photoModel.deleteMany({ _id: { $in: photoIds }, user: req.user.id });

        res.json({ success: true, message: "Permanently deleted" });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ---------------- AUTO DELETE TRASH ---------------- */
exports.autoDeleteExpiredTrash = async (req, res) => {
    try {
        const date = new Date();
        date.setDate(date.getDate() - 30);

        const result = await photoModel.deleteMany({
            user: req.user.id,
            isTrashed: true,
            trashedAt: { $lt: date }
        });

        res.json({
            success: true,
            deleted: result.deletedCount
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Add these missing exports at the bottom of your controller file
exports.getPhotosByScene = async (req, res) => {
  try {
    const { scene } = req.params;
    const photos = await photoModel.find({
      user: req.user.id,
      sceneCategory: scene
    });
    res.json({ success: true, data: photos });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPhotosByFaceCount = async (req, res) => {
  try {
    const { minFaces } = req.params;
    const photos = await photoModel.find({
      user: req.user.id,
      faceCount: { $gte: Number(minFaces) }
    });
    res.json({ success: true, data: photos });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getFlaggedPhotos = async (req, res) => {
  try {
    const photos = await photoModel.find({
      user: req.user.id,
      isFlagged: true
    });
    res.json({ success: true, data: photos });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTopRatedPhotos = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const photos = await photoModel.find({ user: req.user.id })
      .sort({ qualityScore: -1 })
      .limit(limit);
    res.json({ success: true, data: photos });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPhotosWithFaces = async (req, res) => {
  try {
    const photos = await photoModel.find({
      user: req.user.id,
      faceCount: { $gt: 0 }
    });
    res.json({ success: true, data: photos });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};