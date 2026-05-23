const cloudinary = require("cloudinary").v2;

console.log('=== CLOUDINARY CONFIG CHECK ===');
console.log('CLOUD_NAME:', process.env.CLOUD_NAME ? '✅ Present' : '❌ Missing');
console.log('CLOUD_API_KEY:', process.env.CLOUD_API_KEY ? '✅ Present' : '❌ Missing');
console.log('CLOUD_API_SECRET:', process.env.CLOUD_API_SECRET ? '✅ Present' : '❌ Missing');

if (!process.env.CLOUD_NAME || !process.env.CLOUD_API_KEY || !process.env.CLOUD_API_SECRET) {
  console.error('❌ FATAL: Cloudinary credentials missing!');
  // Don't throw here, let the app start but uploads will fail
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
  });
  
  // Test the connection
  cloudinary.api.ping((error, result) => {
    if (error) {
      console.error('❌ Cloudinary connection failed:', error.message);
    } else {
      console.log('✅ Cloudinary connected successfully');
    }
  });
}

module.exports = cloudinary;