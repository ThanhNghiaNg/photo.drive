import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const photoSchema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, required: true, ref: "Event" },
    driveFileId: { type: String, required: true, trim: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    driveCreatedTime: { type: Date, default: null },
    driveModifiedTime: { type: Date, default: null },
    position: { type: Number, required: true, min: 0 },
    syncRunId: { type: String, required: true, index: true },
  },
  { timestamps: true },
);

photoSchema.index({ eventId: 1, driveFileId: 1 }, { unique: true });
photoSchema.index({ eventId: 1, position: 1, _id: 1 });
photoSchema.index({ eventId: 1, syncRunId: 1 });

type PhotoType = InferSchemaType<typeof photoSchema>;
const PhotoModel = (mongoose.models.Photo as Model<PhotoType>) || mongoose.model<PhotoType>("Photo", photoSchema);
export default PhotoModel;
