import jwt from 'jsonwebtoken';
import Admin from '../models/AdminModel.js';
import bcrypt from 'bcryptjs';

const generateToken = (adminId) => {
  return jwt.sign({ id: adminId }, process.env.JWT_SECRET, {
    expiresIn: '1d', // Token expires in 1 day
  });
};

// Register Admin
export const adminSignup = async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    // Check if admin already exists
    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ error: "Admin already exists" });
    }

    // Create new admin
    const admin = await Admin.create({
      fullName,
      email,
      password
    });

    // Generate token
    const token = generateToken(admin._id);

    // Set HTTP-Only Cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 1 day expiry
    });

    // Return admin data (without sensitive info)
    res.status(201).json({
      _id: admin._id,
      email: admin.email,
      fullName: admin.fullName,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Login Admin
export const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  console.log('Login attempt for:', email); // Debug log

  // Basic validation
  if (!email || !password) {
    console.log('Missing credentials');
    return res.status(400).json({ 
      error: "Please provide both email and password",
      details: { received: { email: !!email, password: !!password } }
    });
  }

  try {
    // 1. Find admin
    console.log('Searching for admin in database...');
    const admin = await Admin.findOne({ email }).select('+password');
    
    if (!admin) {
      console.log('Admin not found in database');
      return res.status(401).json({ 
        error: "Invalid credentials",
        details: "No admin found with this email"
      });
    }
    console.log('Admin found:', admin._id);

    // 2. Compare passwords
    console.log('Comparing passwords...');
    const isMatch = await bcrypt.compare(password, admin.password);
    
    if (!isMatch) {
      console.log('Password comparison failed');
      return res.status(401).json({ 
        error: "Invalid credentials",
        details: "Password does not match"
      });
    }
    console.log('Password matched');

    // 3. Update last login
    admin.lastLogin = new Date();
    await admin.save();
    console.log('Last login updated:', admin.lastLogin);

    // 4. Generate token
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: '1d'
    });
    console.log('Token generated');

    // 5. Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    });
    console.log('Cookie set');

    // 6. Send response
    res.status(200).json({
      _id: admin._id,
      email: admin.email,
      fullName: admin.fullName,
      lastLogin: admin.lastLogin,
    });

  } catch (error) {
    console.error('Login error stack:', error.stack);
    res.status(500).json({ 
      error: "Authentication failed",
      details: error.message,
      systemError: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Logout Admin (Clear Cookie)
export const adminLogout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.status(200).json({ message: "Logged out successfully" });
};

// Get Admin Profile
export const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId).select('-password');
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }
    res.status(200).json(admin);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch admin profile" });
  }
};

// Update Admin Profile
export const updateAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId);
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    // Update fields if they exist in the request
    if (req.body.fullName) admin.fullName = req.body.fullName;
    if (req.body.email) admin.email = req.body.email;
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash(req.body.password, salt);
    }

    const updatedAdmin = await admin.save();

    res.status(200).json({
      _id: updatedAdmin._id,
      email: updatedAdmin.email,
      fullName: updatedAdmin.fullName,
      lastLogin: updatedAdmin.lastLogin,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update admin profile" });
  }
};

// Delete Admin Account
export const deleteAdminAccount = async (req, res) => {
  try {
    const admin = await Admin.findByIdAndDelete(req.adminId);
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    // Clear the cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json({ message: "Admin account deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete admin account" });
  }
};