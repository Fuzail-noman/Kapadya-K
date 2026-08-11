const jwt = require("jsonwebtoken");
 
// Route ko protect karta hai — frontend header mein token bhejta hai:
// Authorization: Bearer <token>
function verifyUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;
 
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Login required",
      });
    }
 
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
 
    // authRoutes.js mein token { id: user._id } se sign hota hai
    req.user = decoded;
 
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}
 
module.exports = verifyUser;
 