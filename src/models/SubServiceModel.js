import mongoose from "mongoose";

const subServiceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: false,
      trim: true,
    },
    parentService: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
     imageUrl: {
      type: String,
      required: [true, "Image URL is required"],
    },
  },
  { timestamps: true }
);

export default mongoose.model("SubService", subServiceSchema);