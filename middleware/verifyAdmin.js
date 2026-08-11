const User = require("../models/User");
 
// verifyUser ke baad chalta hai, isliye req.user.id already mojood hota hai.
async function verifyAdmin(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
 
    if (!user || !user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }
 
    next();
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
}
 
module.exports = verifyAdmin;