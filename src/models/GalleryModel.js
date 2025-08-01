

import mongoose from "mongoose";

const GallerySchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  imageUrl: { type: String, required: true },
});

const GalleryModel = mongoose.model("gallery", GallerySchema);
export default GalleryModel;