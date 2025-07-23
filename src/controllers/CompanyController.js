import fs from 'fs';
import Company from '../models/CompanyModel.js';
import { 
  uploadToCloudinary, 
  deleteFromCloudinary, 
  getPublicIdFromUrl 
} from '../middleware/multer.js';

// Create Company
export const createCompany = async (req, res) => {
  try {
    const { title } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Image file is required' 
      });
    }

    const existingCompany = await Company.findOne();
    if (existingCompany) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Company already exists. Use update instead.'
      });
    }

    if (title && title.length > 100) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Title cannot exceed 100 characters'
      });
    }

    const imageUrl = await uploadToCloudinary(req.file.path, 'company');
    const newCompany = await Company.create({ title, imageUrl });

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: newCompany
    });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create company'
    });
  }
};

// Update Company
export const updateCompany = async (req, res) => {
  try {
    const { title } = req.body;
    const existingCompany = await Company.findOne();
    
    if (!existingCompany) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Company not found. Create it first.'
      });
    }

    if (title && title.length > 100) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Title cannot exceed 100 characters'
      });
    }

    let imageUrl = existingCompany.imageUrl;
    
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.path, 'company');
      const oldPublicId = getPublicIdFromUrl(existingCompany.imageUrl);
      if (oldPublicId) await deleteFromCloudinary(oldPublicId);
    }

    existingCompany.title = title || existingCompany.title;
    existingCompany.imageUrl = imageUrl;
    await existingCompany.save();

    res.status(200).json({
      success: true,
      message: 'Company updated successfully',
      data: existingCompany
    });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update company'
    });
  }
};

// Get Company
export const getCompany = async (req, res) => {
  try {
    const company = await Company.findOne();

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.status(200).json({ 
      success: true, 
      data: company 
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company'
    });
  }
};

// Delete Company
export const deleteCompany = async (req, res) => {
  try {
    const company = await Company.findOne();

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    const publicId = getPublicIdFromUrl(company.imageUrl);
    if (publicId) await deleteFromCloudinary(publicId);

    await company.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Company deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete company'
    });
  }
};