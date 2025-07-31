import jwt from "jsonwebtoken";
import Admin from "../models/AdminModel.js";
import Config from "../config/Config.js";

// 🔐 Admin Login
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const admin = await Admin.findOne({ email }).select("+password");
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const { accessToken, refreshToken } = generateTokens(admin);

    // Update lastLogin with direct update query (no full document validation)
    await Admin.findByIdAndUpdate(admin._id, { lastLogin: Date.now() });

    const accessTokenExpiresMs = parseInt(Config.jwtAccessTokenExpiresIn) * 1000;
    const refreshTokenExpiresMs = parseInt(Config.jwtRefreshTokenExpiresIn) * 1000;

    // Set httpOnly cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: accessTokenExpiresMs,
      path: '/',
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: refreshTokenExpiresMs,
      path: '/',
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to login admin",
      error: error.message,
    });
  }
};

// 📝 Admin Registration
export const registerAdmin = async (req, res) => {
  try {
    const { fullName, email, password, role = 'admin' } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Full name, email, and password are required",
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin with this email already exists",
      });
    }

    // Create new admin
    const admin = new Admin({
      fullName,
      email,
      password,
      role,
    });

    await admin.save();

    return res.status(201).json({
      success: true,
      message: "Admin registered successfully",
      data: {
        id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to register admin",
      error: error.message,
    });
  }
};

// 🔑 Change Admin Password
export const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.user?.id; // From auth middleware

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    const admin = await Admin.findById(adminId).select("+password");
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Verify current password
    if (!(await admin.comparePassword(currentPassword))) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to change password",
      error: error.message,
    });
  }
};

// 👤 Get Current Admin
export const getCurrentAdmin = async (req, res) => {
  try {
    const adminId = req.user?.id; // From auth middleware

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const admin = await Admin.findById(adminId).select("-password");
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Admin details retrieved successfully",
      data: admin,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to get admin details",
      error: error.message,
    });
  }
};

// 🔑 Generate Tokens (keep as is)
const generateTokens = (admin) => {
  const accessToken = jwt.sign(
    {
      id: admin._id,
      email: admin.email,
      role: admin.role,
    },
    Config.jwtSecret,
    { expiresIn: Config.jwtAccessTokenExpiresIn }
  );

  const refreshToken = jwt.sign(
    {
      id: admin._id,
    },
    Config.jwtRefreshSecret,
    { expiresIn: Config.jwtRefreshTokenExpiresIn }
  );

  return { accessToken, refreshToken };
};
