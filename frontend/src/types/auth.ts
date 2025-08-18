export interface User {
  _id: string;
  id: string; // For compatibility
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "user" | "analyst";
  isEmailVerified: boolean;
  isActive: boolean;
  lastLogin?: string;
  organization?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organization?: string;
  recaptchaToken?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  recaptchaToken?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    accessToken: string;
  };
  refreshToken?: string;
}

export interface ServiceResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  data?: {
    accessToken: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface SearchRequest {
  companyNames: string[];
  industries?: string[];
  regions?: string[];
  timePeriod?: string;
  searchName?: string;
}

export interface SearchResult {
  _id: string;
  name: string;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: string;
  updatedAt: string;
  results?: any;
}
