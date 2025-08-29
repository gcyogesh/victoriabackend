import About from "../models/aboutModel.js";

// GET About page (just get full page)
export const getAboutPage = async (req, res) => {
  try {
    const about = await About.findOne();
    if (!about) {
      return res.status(404).json({ success: false, message: "About page not found" });
    }
    res.json({ success: true, data: about });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST About page (create or update full page)
export const createOrUpdateAbout = async (req, res) => {
  try {
    const data = req.body;
    let about = await About.findOne();

    if (about) {
      about.pageTitle = data.pageTitle || about.pageTitle;
      about.categories = data.categories || about.categories;
      await about.save();
    } else {
      about = await About.create(data);
    }

    res.json({ success: true, data: about });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT Update specific category by ID
export const updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, description, image, sections } = req.body;

    const about = await About.findOne();
    if (!about) return res.status(404).json({ success: false, message: "About page not found" });

    const category = about.categories.id(categoryId);
    if (!category) return res.status(404).json({ success: false, message: "Category not found" });

    if (name) category.name = name;
    if (description) category.description = description;
    if (image) category.image = image;
    if (sections) category.sections = sections;

    await about.save();
    res.json({ success: true, data: category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE Category by ID
export const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const about = await About.findOne();
    if (!about) return res.status(404).json({ success: false, message: "About page not found" });

    about.categories = about.categories.filter(cat => cat._id.toString() !== categoryId);
    await about.save();

    res.json({ success: true, message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE Section from category
export const deleteSection = async (req, res) => {
  try {
    const { categoryId, sectionId } = req.params;
    const about = await About.findOne();
    if (!about) return res.status(404).json({ success: false, message: "About page not found" });

    const category = about.categories.id(categoryId);
    if (!category) return res.status(404).json({ success: false, message: "Category not found" });

    category.sections = category.sections.filter(sec => sec._id.toString() !== sectionId);
    await about.save();

    res.json({ success: true, message: "Section deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
