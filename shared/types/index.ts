export type RiskIndicator = {
  id: string;
  name: string;
  description: string;
  category: string;
  riskScore: number;
};

export type User = {
  id: string;
  username: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Search = {
  id: string;
  userId: string;
  companyNames: string[];
  filters: {
    industry: string;
    dateRange: {
      start: Date;
      end: Date;
    };
  };
  riskIndicators: RiskIndicator[];
  createdAt: Date;
  updatedAt: Date;
};

export type Project = {
  _id: string;
  id: string;
  userId: string;
  name: string;
  description?: string;
  searchIds: string[];
  searches?: Search[];
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  sharedWith?: Array<{
    userId: string;
    permission: "read" | "write" | "admin";
    sharedAt: Date;
  }>;
};

export type Alert = {
  id: string;
  userId: string;
  message: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Report = {
  id: string;
  userId: string;
  projectId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};
