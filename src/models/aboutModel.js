import mongoose from "mongoose";
import slugify from "slugify";

// Section Schema
const sectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  image: { type: String },
}, { timestamps: true });

// Category Schema
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  image: { type: String },
  sections: [sectionSchema]
}, { timestamps: true });

// 🔥 Auto-generate slug before saving
categorySchema.pre("validate", function (next) {
  if (this.name && !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

// About Page Schema
const aboutSchema = new mongoose.Schema({
  pageTitle: { type: String, default: "About Us" },
  categories: [categorySchema]
}, { timestamps: true });

export default mongoose.model("About", aboutSchema);
