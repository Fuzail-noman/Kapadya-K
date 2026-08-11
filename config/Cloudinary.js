const { v2: cloudinary } = require("cloudinary");
 
// .env mein yeh 3 values Cloudinary dashboard se le kar daalni hain:
// CLOUDINARY_CLOUD_NAME=xxxx
// CLOUDINARY_API_KEY=xxxx
// CLOUDINARY_API_SECRET=xxxx
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
 
module.exports = cloudinary;