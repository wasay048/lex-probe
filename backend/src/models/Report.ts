import { Schema, model, Document, Types } from "mongoose";

export interface IReport extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  searchId: Types.ObjectId;
  title: string;
  description?: string;
  format: "pdf" | "html" | "json";
  content?: any;
  sections: string[];
  filePath?: string;
  fileSize?: number;
  status: "generating" | "completed" | "failed";
  isPublic: boolean;
  downloadCount: number;
  metadata: {
    searchCompanies?: string[];
    searchDate?: Date;
    overallRiskScore?: number;
    generatedBy?: string;
    generatedAt?: Date;
    [key: string]: any;
  };
  sharedWith: Array<{
    email: string;
    sharedAt: Date;
    expiresAt?: Date;
    accessCount: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    searchId: {
      type: Schema.Types.ObjectId,
      ref: "Search",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    format: {
      type: String,
      enum: ["pdf", "html", "json"],
      default: "pdf",
      required: true,
    },
    content: {
      type: Schema.Types.Mixed,
    },
    sections: [
      {
        type: String,
        enum: [
          "executive_summary",
          "methodology",
          "findings",
          "recommendations",
          "raw_data",
        ],
        required: true,
      },
    ],
    filePath: {
      type: String,
    },
    fileSize: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["generating", "completed", "failed"],
      default: "generating",
      index: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
      index: true,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    metadata: {
      searchCompanies: [String],
      searchDate: Date,
      overallRiskScore: Number,
      generatedBy: String,
      generatedAt: Date,
      // Allow additional metadata fields
      type: Schema.Types.Mixed,
      default: {},
    },
    sharedWith: [
      {
        email: {
          type: String,
          required: true,
        },
        sharedAt: {
          type: Date,
          default: Date.now,
        },
        expiresAt: {
          type: Date,
        },
        accessCount: {
          type: Number,
          default: 0,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Update the updatedAt field before saving
reportSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Create indexes for better query performance
reportSchema.index({ userId: 1, createdAt: -1 });
reportSchema.index({ searchId: 1 });
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ "sharedWith.email": 1 });
reportSchema.index({ "sharedWith.expiresAt": 1 });
reportSchema.index({ isPublic: 1, createdAt: -1 });

export const Report = model<IReport>("Report", reportSchema);
export default Report;
