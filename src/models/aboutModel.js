import mongoose from "mongoose";

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

// About Page Schema
const aboutSchema = new mongoose.Schema({
  pageTitle: { type: String, default: "About Us" },
  categories: [categorySchema]
}, { timestamps: true });

export default mongoose.model("About", aboutSchema);
