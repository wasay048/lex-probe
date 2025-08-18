import mongoose, { Schema, Document } from "mongoose";

export interface IProject extends Document {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  searchIds: string[];
  tags: string[];
  isActive: boolean;
  sharedWith: Array<{
    userId: string;
    permission: "read" | "write" | "admin";
    sharedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const sharedWithSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      ref: "User",
    },
    permission: {
      type: String,
      enum: ["read", "write", "admin"],
      default: "read",
    },
    sharedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const projectSchema = new Schema<IProject>(
  {
    userId: {
      type: String,
      required: [true, "User ID is required"],
      ref: "User",
    },
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
      maxlength: [100, "Project name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    searchIds: [
      {
        type: String,
        ref: "Search",
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
        maxlength: [50, "Tag cannot exceed 50 characters"],
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    sharedWith: [sharedWithSchema],
  },
  {
    timestamps: true,
  }
);

// Indexes
projectSchema.index({ userId: 1, createdAt: -1 });
projectSchema.index({ name: "text", description: "text" });
projectSchema.index({ tags: 1 });
projectSchema.index({ "sharedWith.userId": 1 });

export const Project = mongoose.model<IProject>("Project", projectSchema);
