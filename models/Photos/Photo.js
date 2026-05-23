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
  publicId: {  // ADD THIS
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String
  },
  title: {
    type: String,
    default: ''
  },
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
  category: {  // ADD THIS if you want to keep it
    type: String,
    default: 'General'
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
  isStarred: {
    type: Boolean,
    default: false
  },
  tags: {
    type: [String],
    default: []
  },
  format: String,
  size: Number,
  
  // Trash fields
  isTrashed: {
    type: Boolean,
    default: false
  },
  trashedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes
PhotoSchema.index({ user: 1, isTrashed: 1, trashedAt: 1 });
PhotoSchema.index({ user: 1, sceneCategory: 1 });
PhotoSchema.index({ user: 1, createdAt: -1 });
PhotoSchema.index({ user: 1, isStarred: 1 });
PhotoSchema.index({ user: 1, qualityScore: -1 });

module.exports = mongoose.model('Photo', PhotoSchema);