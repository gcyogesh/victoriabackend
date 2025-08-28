import About from "../models/aboutModel.js";

// GET About page
export const getAboutPage = async (req, res) => {
  try {
    const { slug } = req.params;
    const about = await About.findOne();

    if (!about) return res.status(404).json({ success: false, message: "About page not found" });

    if (slug) {
      const category = about.categories?.find(cat => cat.slug === slug);
      if (!category) {
        return res.status(404).json({ success: false, message: "Category not found" });
      }
      return res.json({ success: true, data: category });
    }

    res.json({ success: true, data: about });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST About page (create or update)
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
