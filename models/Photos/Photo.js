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
    enum: ['Party', 'Event', 'Trip', 'General'], // Capitalized & aligned with primary folders
    default: 'General'
  },
  environment: {
    type: String,
    enum: ['Indoor', 'Outdoor'],                 // Captures Spatial Zone folder layout
    default: 'Indoor'
  },
  socialGroup: {
    type: String,
    enum: ['Solo', 'Couple', 'Group', 'Empty'],  // Captures Social Density folder layout
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
  size: Number
}, {
  timestamps: true
});

PhotoSchema.index({ user: 1, sceneCategory: 1, environment: 1, socialGroup: 1 });
PhotoSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Photo', PhotoSchema);