const path = require('path');
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/aetherchat',
  JWT_SECRET: process.env.JWT_SECRET || 'aether_super_jwt_secret_dev_123',
  JWT_EXPIRES_IN: '7d',
  
  // File Upload Settings
  UPLOAD_DIR: path.join(__dirname, 'uploads'),
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB limit
  ALLOWED_FILE_TYPES: [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/mpeg', 'video/quicktime',
    'application/pdf', 'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
    'application/zip', 'application/x-zip-compressed'
  ],

  // Cloud Storage configuration (Cloudinary / S3 Hooks)
  CLOUDINARY: {
    CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || null,
    API_KEY: process.env.CLOUDINARY_API_KEY || null,
    API_SECRET: process.env.CLOUDINARY_API_SECRET || null
  },
  AWS_S3: {
    BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME || null,
    ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || null,
    SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || null,
    REGION: process.env.AWS_REGION || null
  },

  // Frontend link (for CORS socket checks)
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000'
};
