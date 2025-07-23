import jwt from 'jsonwebtoken';
import Admin from '../models/AdminModel.js';

export const protect = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify admin still exists
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(401).json({ error: "Not authorized, admin not found" });
    }

    req.adminId = decoded.id; // Attach admin ID to the request
    next();
  } catch (error) {
    return res.status(401).json({ error: "Not authorized, invalid token" });
  }
};

// Optional: Admin role middleware (if you need role-based auth later)
export const adminRole = (req, res, next) => {
  // You can implement role checking here if needed
  next();
};