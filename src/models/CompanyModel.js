import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    imageUrl: {
      type: String,
      required: [true, "Image URL is required"],
    },
  },
  { timestamps: true }
);
export default mongoose.model("Company", companySchema);