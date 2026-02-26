import mongoose from "mongoose";

const photoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    placeName: { type: String, default: "" },
    shotAt: { type: Date, default: null },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    },
    imageUrl: { type: String, required: true }
  },
  { timestamps: true }
);

export const Photo = mongoose.model("Photo", photoSchema);
