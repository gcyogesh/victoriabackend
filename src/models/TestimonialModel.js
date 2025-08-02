  import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true },
    name: { type: String, required: true },
    stars: { 
      type: Number, 
      required: true,
      min: 1,
      max: 5
    },
    description: { type: String, required: true },
  },
  { timestamps: true }
);

const ClientReviewModel = mongoose.model("ClientReview", testimonialSchema);
export default ClientReviewModel;