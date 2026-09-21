import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const eventSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, default: "", trim: true },
    eventDate: { type: Date, required: true },
    location: { type: String, default: "", trim: true },
    driveFolderId: { type: String, required: true, trim: true },
    thumbnailFileId: { type: String, default: "", trim: true },
    photoCount: { type: Number, default: 0, min: 0 },
    featured: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    lastSyncedAt: { type: Date, default: null },
    syncRunId: { type: String, default: "" },
    syncProcessed: { type: Number, default: 0 },
    syncStatus: { type: String, enum: ["idle", "syncing", "error"], default: "idle" },
    syncError: { type: String, default: "" },
  },
  { timestamps: true },
);

eventSchema.index({ status: 1, eventDate: -1 });
eventSchema.index({ featured: 1, status: 1, sortOrder: 1 });

type EventType = InferSchemaType<typeof eventSchema>;

const EventModel = (mongoose.models.Event as Model<EventType>) || mongoose.model<EventType>("Event", eventSchema);
export default EventModel;
