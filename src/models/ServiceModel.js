// import mongoose from "mongoose";

// const serviceSchema = new mongoose.Schema(
//   {
//     title: {
//       type: String,
//       required: [true, "Title is required"],
//       trim: true,
//       maxlength: [100, "Title cannot exceed 100 characters"],
//     },
//     description: {
//       type: String,
//       required: [true, "Description is required"],
//       trim: true,
//       maxlength: [500, "Description cannot exceed 500 characters"],
//     },
//     imageUrl: {
//       type: String,
//       required: [true, "Image URL is required"],
//     },
//     slug: {
//       type: String,
//       unique: true,
//       lowercase: true,
//     },
//     isFeatured: {
//       type: Boolean,
//       default: false,
//     },
//     category: {
//       type: String,
//       enum: ["residential", "commercial", "both"],
//       required: true,
//     },
//   },
//   { timestamps: true }
// );

// // Auto-generate slug before saving
// // serviceSchema.pre("save", function (next) {
// //   if (!this.slug || this.isModified("title")) {
// //     this.slug = this.title
// //       .toLowerCase()
// //       .replace(/[^\w\s-]/g, "")
// //       .replace(/\s+/g, "-")
// //       .replace(/-+/g, "-")
// //       .trim();
// //   }
// //   next();
// // });
// serviceSchema.pre("save", function (next) {
//   if (!this.slug || this.isModified("title")) {
//     this.slug = `${this.title
//       .toLowerCase()
//       .replace(/[^\w\s-]/g, "")
//       .replace(/\s+/g, "-")
//       .replace(/-+/g, "-")
//       .trim()}-${Date.now()}`;
//   }
//   next();
// });

// export default mongoose.model("Service", serviceSchema);

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
      maxlength: [500, "Description cannot exceed 500 characters"],
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
    category: {
      type: String,
      enum: ["residential", "commercial", "both"],
      required: true,
    },
    subServices: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubService"
    }],
    hasSubServices: {
      type: Boolean,
      default: false
    }
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