import mongoose from "mongoose";

const featureSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
      required: true,
    },
    image: {
      type: String, // store image URL or path
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Feature", featureSchema);



