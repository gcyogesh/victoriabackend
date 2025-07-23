import mongoose from "mongoose";
import slugify from "slugify";

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    imageUrl: { type: String, required: true },
    description: { type: String, required: true, trim: true },
    postedAt: { type: Date, default: Date.now },
    author: { type: String, required: true, trim: true },
    authorImageUrl: { type: String, required: false },
    slug: { type: String, required: true, unique: true, trim: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Generate slug before saving
blogSchema.pre("save", function(next) {
  if (this.isModified("title")) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

const BlogModel = mongoose.model("Blog", blogSchema);
export default BlogModel; 