import mongoose, { Schema, Document } from "mongoose";

export interface ICompany {
  name: string;
  website: string;
  industry?: string;
}

export interface ISearchFilters {
  industry?: string;
  dateRange: {
    from: Date;
    to: Date;
  };
  searchType: "past" | "future" | "real-time";
}

export interface IRiskIndicator {
  category: string;
  indicator: string;
  riskScore: number;
  isSelected: boolean;
}

export interface ISearchResult {
  indicator: string;
  category: string;
  riskScore: number;
  confidence: number;
  evidence: Array<{
    source: string;
    url: string;
    content: string;
    timestamp: Date;
    relevanceScore: number;
  }>;
  summary?: string;
}

export interface ISearch extends Document {
  _id: string;
  userId: string;
  projectId?: string; // Optional project assignment
  companies: ICompany[];
  filters: ISearchFilters;
  selectedIndicators: IRiskIndicator[];
  searchMode: "osint" | "api" | "both";
  status:
    | "pending"
    | "in-progress"
    | "completed"
    | "failed"
    | "scraping"
    | "formatting"
    | "analyzing";
  results?: ISearchResult[];
  analysisResults?: any; // Comprehensive analysis results from CartelAnalysisService
  overallRiskScore?: number;
  executionTime?: number;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const companySchema = new Schema<ICompany>(
  {
    name: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    website: {
      type: String,
      required: [true, "Company website is required"],
      trim: true,
      match: [/^https?:\/\/.+/, "Please enter a valid URL"],
    },
    industry: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const searchFiltersSchema = new Schema<ISearchFilters>(
  {
    industry: {
      type: String,
      trim: true,
    },
    dateRange: {
      from: {
        type: Date,
        required: true,
      },
      to: {
        type: Date,
        required: true,
      },
    },
    searchType: {
      type: String,
      enum: ["past", "future", "real-time"],
      required: true,
    },
  },
  { _id: false }
);

const riskIndicatorSchema = new Schema<IRiskIndicator>(
  {
    category: {
      type: String,
      required: true,
    },
    indicator: {
      type: String,
      required: true,
    },
    riskScore: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    isSelected: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const evidenceSchema = new Schema(
  {
    source: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
    },
    relevanceScore: {
      type: Number,
      min: 0,
      max: 1,
      required: true,
    },
  },
  { _id: false }
);

const searchResultSchema = new Schema<ISearchResult>(
  {
    indicator: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    riskScore: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      required: true,
    },
    evidence: [evidenceSchema],
    summary: {
      type: String,
    },
  },
  { _id: false }
);

const searchSchema = new Schema<ISearch>(
  {
    userId: {
      type: String,
      required: [true, "User ID is required"],
      ref: "User",
    },
    projectId: {
      type: String,
      ref: "Project",
      default: null,
    },
    companies: {
      type: [companySchema],
      required: [true, "At least 2 companies are required"],
      validate: {
        validator: function (companies: ICompany[]) {
          return companies.length >= 2;
        },
        message: "At least 2 companies are required for comparison",
      },
    },
    filters: {
      type: searchFiltersSchema,
      required: true,
    },
    selectedIndicators: {
      type: [riskIndicatorSchema],
      required: [true, "At least one risk indicator must be selected"],
      validate: {
        validator: function (indicators: IRiskIndicator[]) {
          return indicators.some((indicator) => indicator.isSelected);
        },
        message: "At least one risk indicator must be selected",
      },
    },
    searchMode: {
      type: String,
      enum: ["osint", "api", "both"],
      required: [true, "Search mode is required"],
    },
    status: {
      type: String,
      enum: [
        "pending",
        "in-progress",
        "completed",
        "failed",
        "scraping",
        "formatting",
        "analyzing",
      ],
      default: "pending",
    },
    results: [searchResultSchema],
    analysisResults: {
      type: Schema.Types.Mixed, // Stores comprehensive analysis results from CartelAnalysisService
      default: null,
    },
    overallRiskScore: {
      type: Number,
      min: 0,
      max: 10,
    },
    executionTime: {
      type: Number,
    },
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
searchSchema.index({ userId: 1, createdAt: -1 });
searchSchema.index({ status: 1 });
searchSchema.index({ "companies.name": 1 });

export const Search = mongoose.model<ISearch>("Search", searchSchema);
