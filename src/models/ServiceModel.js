import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [12000 , "Description cannot exceed 3000 characters"],
    },
    imageUrl: {
      type: String,
      required: [true, "Image URL is required"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    bestFor: {
      type: String,
      trim: true,
      maxlength: [200, "Best for cannot exceed 200 characters"]
    },
    faq: [
      {
        question: { type: String, required: true, trim: true },
        answer: { type: String, required: true, trim: true }
      }
    ],
    subservices: [
      {
        title: { type: String, required: true, trim: true }
      }
    ],
  },
  { timestamps: true }
);

// Auto-generate slug with timestamp to ensure uniqueness
serviceSchema.pre("save", function (next) {
  if (!this.slug || this.isModified("title")) {
    this.slug = `${this.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()}-${Date.now()}`;
  }
  next();
});

export default mongoose.model("Service", serviceSchema);