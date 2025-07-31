import ContactInfo from '../models/ContactInfoModel.js';

// Create or Update Contact Info (singleton)
export const saveContactInfo = async (req, res) => {
  try {
    const { address, phones, email, whatsappNumber, socialLinks } = req.body;

    let info = await ContactInfo.findOne();

    if (info) {
      info.address = address;
      info.phones = phones;
      info.email = email;
      info.whatsappNumber = whatsappNumber;
      info.socialLinks = socialLinks;
    } else {
      info = new ContactInfo({
        address,
        phones,
        email,
        whatsappNumber,
        socialLinks,
      });
    }

    const saved = await info.save();
    return res.status(200).json({
      success: true,
      message: 'Contact info saved successfully',
      data: saved,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while saving contact info',
      error: error.message,
    });
  }
};

// Get Contact Info
export const getContactInfo = async (req, res) => {
  try {
    const info = await ContactInfo.findOne();
    if (!info) {
      return res.status(404).json({
        success: false,
        message: 'Contact info not found',
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Contact info fetched successfully',
      data: info,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch contact info',
      error: error.message,
    });
  }
};

// Delete Contact Info
export const deleteContactInfo = async (req, res) => {
  try {
    const info = await ContactInfo.findOne();
    if (!info) {
      return res.status(404).json({
        success: false,
        message: 'No contact info to delete',
      });
    }
    await ContactInfo.findByIdAndDelete(info._id);
    return res.status(200).json({
      success: true,
      message: 'Contact info deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete contact info',
      error: error.message,
    });
  }
};
