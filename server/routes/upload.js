const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const config = require('../config');

const router = express.Router();

// Ensure upload directory exists
if (!fs.existsSync(config.UPLOAD_DIR)) {
  fs.mkdirSync(config.UPLOAD_DIR, { recursive: true });
}

// Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter validation
const fileFilter = (req, file, cb) => {
  if (config.ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Check allowed extension formats.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: config.MAX_FILE_SIZE },
  fileFilter: fileFilter
});

// Upload route
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please select a file to upload.' });
    }

    // Default: Local Storage details
    let fileUrl = `/uploads/${req.file.filename}`;
    
    // PRODUCTION AWS S3 / CLOUDINARY HOOKS (Triggered if keys are present in env)
    // ------------------------------------------------------------------------
    //
    // if (config.CLOUDINARY.CLOUD_NAME && config.CLOUDINARY.API_KEY) {
    //   const cloudinary = require('cloudinary').v2;
    //   cloudinary.config({
    //     cloud_name: config.CLOUDINARY.CLOUD_NAME,
    //     api_key: config.CLOUDINARY.API_KEY,
    //     api_secret: config.CLOUDINARY.API_SECRET
    //   });
    //   const result = await cloudinary.uploader.upload(req.file.path, { resource_type: 'auto' });
    //   fileUrl = result.secure_url;
    //   fs.unlinkSync(req.file.path); // remove temp local file
    // }
    //
    // else if (config.AWS_S3.ACCESS_KEY_ID && config.AWS_S3.SECRET_ACCESS_KEY) {
    //   const AWS = require('aws-sdk');
    //   const s3 = new AWS.S3({
    //     accessKeyId: config.AWS_S3.ACCESS_KEY_ID,
    //     secretAccessKey: config.AWS_S3.SECRET_ACCESS_KEY,
    //     region: config.AWS_S3.REGION
    //   });
    //   const fileStream = fs.createReadStream(req.file.path);
    //   const uploadParams = {
    //     Bucket: config.AWS_S3.BUCKET_NAME,
    //     Key: req.file.filename,
    //     Body: fileStream,
    //     ContentType: req.file.mimetype
    //   };
    //   const result = await s3.upload(uploadParams).promise();
    //   fileUrl = result.Location;
    //   fs.unlinkSync(req.file.path); // remove temp local file
    // }
    //
    // ------------------------------------------------------------------------

    return res.json({
      url: fileUrl,
      name: req.file.originalname,
      fileType: req.file.mimetype,
      size: req.file.size
    });
  } catch (err) {
    console.error('File upload route error:', err);
    // Clean up local file in case of error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({ error: err.message || 'Upload processing error.' });
  }
});

module.exports = router;
