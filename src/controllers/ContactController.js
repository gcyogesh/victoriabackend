import Contact from "../models/ContactModel.js";

// Submit contact form
export const submitContactForm = async (req, res) => {
  console.log('=== SUBMIT CONTACT FORM REQUEST ===');
  console.log('Request body:', req.body);

  try {
    const { name, email, phone, address, message, country = 'AU' } = req.body;

    // Validate required fields
    if (!name || !email || !address || !message) {
      console.log('Validation failed - missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Name, email, address, and message are required',
        error: 'MISSING_REQUIRED_FIELDS'
      });
    }

    console.log('Creating contact record...');
    const contact = await Contact.create({
      name: name.trim(),
      email: email.trim(),
      phone: phone ? phone.trim() : null,
      address: address.trim(),
      message: message.trim(),
      country
    });

    console.log('Contact created successfully:', contact);

    return res.status(201).json({
      success: true,
      message: "Thank you for your message! We'll get back to you soon.",
      data: {
        id: contact._id,
        name: contact.name,
        email: contact.email
      }
    });

  } catch (error) {
    console.error('Error in submitContactForm:', error);
    
    // Handle duplicate email error
    if (error.code === 11000 || error.name === 'MongoServerError') {
      return res.status(409).json({
        success: false,
        message: 'Contact with this email already exists',
        error: 'DUPLICATE_EMAIL'
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
        error: 'VALIDATION_ERROR'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to submit contact form',
      error: 'SERVER_ERROR'
    });
  }
};

// Get all contacts (admin only)
export const getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch contacts",
      error: error.message,
    });
  }
};

// Get single contact (admin only)
export const getContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }
    res.status(200).json({
      success: true,
      data: contact,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch contact",
      error: error.message,
    });
  }
};

// Update contact status (admin only)
export const updateContactStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Contact status updated",
      data: contact,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update contact status",
      error: error.message,
    });
  }
};

// Delete contact (admin only)
export const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Contact deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete contact",
      error: error.message,
    });
  }
};