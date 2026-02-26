import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    photoId: { type: mongoose.Schema.Types.ObjectId, ref: "Photo", required: true },
    nickname: { type: String, required: true },
    content: { type: String, required: true },
    hidden: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Comment = mongoose.model("Comment", commentSchema);
