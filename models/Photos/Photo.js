// models/photoModel.js
const mongoose = require('mongoose');

const PhotoSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  imageUrl: {
    type: String,
    required: [true, 'Original image path is required']
  },
  thumbnailUrl: {
    type: String
  },

  // ── EXACT DIRECTORY COGNITIVE TAXONOMY MATCHES ──
  sceneCategory: {
    type: String,
    enum: ['Party', 'Event', 'Trip', 'General'],
    default: 'General'
  },
  environment: {
    type: String,
    enum: ['Indoor', 'Outdoor'],
    default: 'Indoor'
  },
  socialGroup: {
    type: String,
    enum: ['Solo', 'Couple', 'Group', 'Empty'],
    default: 'Solo'
  },
  faceCount: {
    type: Number,
    default: 0
  },
  qualityScore: {
    type: Number,
    default: 0
  },
  isFlagged: {
    type: Boolean,
    default: false
  },
  tags: {
    type: [String],
    default: []
  },
  format: String,
  size: Number,
  
  // ── TRASH FIELDS (ADD THESE) ──
  isTrashed: {
    type: Boolean,
    default: false
  },
  trashedAt: {
    type: Date,
    default: null
  },
  isDuplicate: {
    type: Boolean,
    default: false
  },
  duplicateOf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Photo',
    default: null
  }
}, {
  timestamps: true
});

// Add index for trash queries
PhotoSchema.index({ user: 1, isTrashed: 1, trashedAt: 1 });
PhotoSchema.index({ user: 1, sceneCategory: 1, environment: 1, socialGroup: 1 });
PhotoSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Photo', PhotoSchema);