const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({

  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false                   // Ensures password isn't returned in simple queries / API response
  },
  role: {
    type: String,
    default: 'user' 
  },
  resetOtp: {
    type: String,
  },
  resetOtpExpire: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true 
});


module.exports = mongoose.model('User', UserSchema);