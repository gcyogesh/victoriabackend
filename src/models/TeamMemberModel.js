import mongoose from "mongoose";

const teamMemberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    role: {
      type: String,
      required: [true, "Role is required"],
      trim: true,
      maxlength: [50, "Role cannot exceed 50 characters"],
    },
    imageUrl: {
      type: String,
      required: [true, "Image URL is required"],
    }
  },
  { timestamps: true }
);

export default mongoose.model("TeamMember", teamMemberSchema);