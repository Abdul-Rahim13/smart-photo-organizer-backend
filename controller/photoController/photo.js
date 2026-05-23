const mongoose = require("mongoose");
const photoModel = require("../../models/Photos/Photo");
const cloudinary = require("../../config/cloud");
const axios = require('axios');
const analyzeWithHuggingFace = require('../../services/aiAnalysis');

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

/* ---------------- UPLOAD WITH AI ANALYSIS ---------------- */
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
            console.log(`\n📷 Processing file: ${file.originalname}`);
            console.log(`   Cloudinary URL: ${file.path}`);
            console.log(`   File size: ${file.size} bytes`);
            
            // Default values if AI fails
            let aiAnalysis = {
                sceneCategory: req.body.sceneCategory || "General",
                environment: req.body.environment || "Indoor",
                socialGroup: req.body.socialGroup || "Solo",
                faceCount: Number(req.body.faceCount) || 1,
                qualityScore: Number(req.body.qualityScore) || 85,
                isFlagged: false
            };
            
            // Run AI analysis if API key exists
            if (process.env.HUGGINGFACE_API_KEY && file.path) {
                try {
                    console.log('   🔍 Downloading image from Cloudinary for AI analysis...');
                    const imageResponse = await axios.get(file.path, { 
                        responseType: 'arraybuffer',
                        timeout: 30000
                    });
                    console.log(`   📥 Downloaded: ${imageResponse.data.length} bytes`);
                    
                    const imageBuffer = Buffer.from(imageResponse.data);
                    
                    console.log('   🧠 Running Hugging Face AI analysis...');
                     aiAnalysis = await analyzeWithHuggingFace(imageBuffer, file.originalname);
                    console.log(`   ✅ AI Analysis Result:`, aiAnalysis);
                    
                } catch (aiError) {
                    console.error(`   ❌ AI Analysis failed for ${file.originalname}:`, aiError.message);
                    if (aiError.response) {
                        console.error(`      Status: ${aiError.response.status}`);
                        console.error(`      Data:`, JSON.stringify(aiError.response.data).substring(0, 200));
                    }
                    console.log('   → Using default values');
                }
            } else {
                console.log('   ⚠️ Skipping AI analysis - no API key or invalid file path');
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
        console.log(`\n✅ Successfully saved ${saved.length} photo(s) with AI analysis`);
        saved.forEach(photo => {
            console.log(`   - ${photo.title}: ${photo.sceneCategory} | ${photo.environment} | ${photo.socialGroup} | Score: ${photo.qualityScore}`);
        });

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
        const photos = await photoModel.find({ user: req.user.id, isTrashed: false }).sort({ createdAt: -1 });
        console.log(`📸 Fetched ${photos.length} photos for user ${req.user.id}`);
        res.json({ success: true, data: photos });
    } catch (err) {
        console.error("Get all photos error:", err);
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
        console.error("Get photo by ID error:", err);
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

        if (req.body.sceneCategory) photo.sceneCategory = req.body.sceneCategory;
        if (req.body.environment) photo.environment = req.body.environment;
        if (req.body.socialGroup) photo.socialGroup = req.body.socialGroup;
        if (req.body.title) photo.title = req.body.title;
        if (req.body.tags) photo.tags = normalizeTags(req.body.tags);

        await photo.save();
        console.log(`✏️ Updated photo: ${photo._id}`);
        res.json({ success: true, data: photo });
    } catch (err) {
        console.error("Update photo error:", err);
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
            console.log(`🗑️ Deleted from Cloudinary: ${photo.publicId}`);
        }

        await photo.deleteOne();
        console.log(`🗑️ Deleted photo: ${photo._id}`);
        res.json({ success: true, message: "Photo deleted successfully" });
    } catch (err) {
        console.error("Delete photo error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ---------------- GET PHOTOS BY SCENE ---------------- */
exports.getPhotosByScene = async (req, res) => {
    try {
        const { scene } = req.params;
        console.log(`🔍 Filtering by scene: ${scene}`);
        const photos = await photoModel.find({ 
            user: req.user.id, 
            sceneCategory: scene,
            isTrashed: false 
        }).sort({ createdAt: -1 });
        res.json({ success: true, data: photos });
    } catch (err) {
        console.error("Get photos by scene error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ---------------- GET PHOTOS BY FACE COUNT ---------------- */
exports.getPhotosByFaceCount = async (req, res) => {
    try {
        const { minFaces } = req.params;
        console.log(`🔍 Filtering by min faces: ${minFaces}`);
        const photos = await photoModel.find({ 
            user: req.user.id, 
            faceCount: { $gte: Number(minFaces) },
            isTrashed: false 
        }).sort({ createdAt: -1 });
        res.json({ success: true, data: photos });
    } catch (err) {
        console.error("Get photos by face count error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ---------------- GET FLAGGED PHOTOS ---------------- */
exports.getFlaggedPhotos = async (req, res) => {
    try {
        console.log(`🔍 Filtering flagged photos`);
        const photos = await photoModel.find({ 
            user: req.user.id, 
            isFlagged: true,
            isTrashed: false 
        }).sort({ createdAt: -1 });
        res.json({ success: true, data: photos });
    } catch (err) {
        console.error("Get flagged photos error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ---------------- GET TOP RATED PHOTOS ---------------- */
exports.getTopRatedPhotos = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        console.log(`🔍 Getting top ${limit} rated photos`);
        const photos = await photoModel.find({ 
            user: req.user.id, 
            isTrashed: false 
        }).sort({ qualityScore: -1 }).limit(limit);
        res.json({ success: true, data: photos });
    } catch (err) {
        console.error("Get top rated photos error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ---------------- GET PHOTOS WITH FACES ---------------- */
exports.getPhotosWithFaces = async (req, res) => {
    try {
        console.log(`🔍 Filtering photos with faces`);
        const photos = await photoModel.find({ 
            user: req.user.id, 
            faceCount: { $gt: 0 },
            isTrashed: false 
        }).sort({ createdAt: -1 });
        res.json({ success: true, data: photos });
    } catch (err) {
        console.error("Get photos with faces error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ---------------- FILTER PHOTOS ---------------- */
exports.filterPhotos = async (req, res) => {
    try {
        const filter = { user: req.user.id, isTrashed: false };
        
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
        
        console.log(`🔍 Applying filters:`, filter);
        const photos = await photoModel.find(filter).sort({ createdAt: -1 });
        res.json({ success: true, data: photos });
    } catch (err) {
        console.error("Filter photos error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ---------------- SEARCH PHOTOS ---------------- */
exports.searchPhotos = async (req, res) => {
    try {
        const { tag } = req.query;
        
        if (!tag) {
            return res.status(400).json({ success: false, message: "tag is required" });
        }
        
        console.log(`🔍 Searching for tag: ${tag}`);
        const photos = await photoModel.find({
            user: req.user.id,
            tags: { $in: [tag] },
            isTrashed: false
        }).sort({ createdAt: -1 });
        
        res.json({ success: true, data: photos });
    } catch (err) {
        console.error("Search photos error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ---------------- TOGGLE STAR ---------------- */
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
        console.log(`⭐ Toggled star for photo ${photo._id}: ${photo.isStarred}`);
        res.json({ success: true, data: photo });
    } catch (err) {
        console.error("Toggle star error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ---------------- MOVE TO TRASH ---------------- */
exports.moveToTrash = async (req, res) => {
    try {
        const { photoIds } = req.body;
        
        if (!Array.isArray(photoIds) || !photoIds.length) {
            return res.status(400).json({ success: false, message: "photoIds required" });
        }
        
        console.log(`🗑️ Moving ${photoIds.length} photos to trash`);
        await photoModel.updateMany(
            { _id: { $in: photoIds }, user: req.user.id },
            { isTrashed: true, trashedAt: new Date() }
        );
        
        res.json({ success: true, message: "Moved to trash" });
    } catch (err) {
        console.error("Move to trash error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ---------------- RESTORE FROM TRASH ---------------- */
exports.restoreFromTrash = async (req, res) => {
    try {
        const { photoIds } = req.body;
        
        if (!Array.isArray(photoIds) || !photoIds.length) {
            return res.status(400).json({ success: false, message: "photoIds required" });
        }
        
        console.log(`🔄 Restoring ${photoIds.length} photos from trash`);
        await photoModel.updateMany(
            { _id: { $in: photoIds }, user: req.user.id },
            { isTrashed: false, trashedAt: null }
        );
        
        res.json({ success: true, message: "Restored successfully" });
    } catch (err) {
        console.error("Restore from trash error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ---------------- GET TRASHED PHOTOS ---------------- */
exports.getTrashedPhotos = async (req, res) => {
    try {
        console.log(`🗑️ Getting trashed photos`);
        const photos = await photoModel.find({
            user: req.user.id,
            isTrashed: true
        }).sort({ trashedAt: -1 });
        
        res.json({ success: true, data: photos });
    } catch (err) {
        console.error("Get trashed photos error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ---------------- PERMANENTLY DELETE ---------------- */
exports.permanentlyDeletePhotos = async (req, res) => {
    try {
        const { photoIds } = req.body;
        
        if (!Array.isArray(photoIds) || !photoIds.length) {
            return res.status(400).json({ success: false, message: "photoIds required" });
        }
        
        console.log(`💀 Permanently deleting ${photoIds.length} photos`);
        const photos = await photoModel.find({ _id: { $in: photoIds }, user: req.user.id });
        
        for (let photo of photos) {
            if (photo.publicId) {
                await cloudinary.uploader.destroy(photo.publicId);
                console.log(`   Deleted from Cloudinary: ${photo.publicId}`);
            }
        }
        
        await photoModel.deleteMany({ _id: { $in: photoIds }, user: req.user.id });
        res.json({ success: true, message: "Permanently deleted" });
    } catch (err) {
        console.error("Permanent delete error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ---------------- AUTO DELETE EXPIRED TRASH ---------------- */
exports.autoDeleteExpiredTrash = async (req, res) => {
    try {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        
        console.log(`🕐 Auto-deleting trash older than 30 days`);
        const result = await photoModel.deleteMany({
            user: req.user.id,
            isTrashed: true,
            trashedAt: { $lt: date }
        });
        
        console.log(`   Deleted ${result.deletedCount} expired photos`);
        res.json({
            success: true,
            deleted: result.deletedCount
        });
    } catch (err) {
        console.error("Auto delete error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};