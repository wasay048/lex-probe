import { Schema, model, Document, Types } from "mongoose";
export type AlertType = "search_complete"
    | "high_risk_detected"
    | "project_shared"
    | "system"
    | "warning"
    | "error"
    | "info";
    
export interface IAlert extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: AlertType;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: Date;
  relatedSearchId?: Types.ObjectId;
  relatedProjectId?: Types.ObjectId;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const alertSchema = new Schema<IAlert>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "search_complete",
        "high_risk_detected",
        "project_shared",
        "system",
        "warning",
        "error",
        "info",
      ],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    relatedSearchId: {
      type: Schema.Types.ObjectId,
      ref: "Search",
      default: null,
    },
    relatedProjectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
alertSchema.index({ userId: 1, createdAt: -1 });
alertSchema.index({ userId: 1, isRead: 1 });
alertSchema.index({ userId: 1, type: 1 });
alertSchema.index({ createdAt: -1 });

// Pre-save middleware to update readAt when isRead changes
alertSchema.pre("save", function (this: IAlert, next) {
  if (this.isModified("isRead")) {
    if (this.isRead && !this.readAt) {
      this.readAt = new Date();
    } else if (!this.isRead) {
      this.readAt = undefined;
    }
  }
  next();
});

export const Alert = model<IAlert>("Alert", alertSchema);
export default Alert;
