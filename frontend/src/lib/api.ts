import axios, { AxiosResponse } from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export interface ServiceResponse {
  success: boolean;
  message: string;
  data?: any;
  errors?: any;
}

// Create axios instance with interceptors
const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        if (typeof window !== "undefined") {
          const refreshToken = localStorage.getItem("refreshToken");
          if (refreshToken) {
            const response = await axios.post(
              `${API_BASE_URL}/api/v1/auth/refresh-token`,
              { refreshToken }
            );

            if (response.data.success) {
              const newToken = response.data.data.accessToken;
              localStorage.setItem("accessToken", newToken);
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return api(originalRequest);
            }
          }
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    recaptchaToken: string;
  }): Promise<AxiosResponse<ServiceResponse>> =>
    api.post("/auth/register", data),

  login: (data: {
    email: string;
    password: string;
    recaptchaToken?: string;
  }): Promise<AxiosResponse<ServiceResponse>> => {
    console.log('API login called with baseURL:', `${API_BASE_URL}/api/v1`); // Debug log
    console.log('Login data:', data); // Debug log
    return api.post("/auth/login", data);
  },

  logout: (): Promise<AxiosResponse<ServiceResponse>> =>
    api.post("/auth/logout"),

  refreshToken: (data: {
    refreshToken: string;
  }): Promise<AxiosResponse<ServiceResponse>> =>
    api.post("/auth/refresh-token", data),

  getProfile: (): Promise<AxiosResponse<ServiceResponse>> =>
    api.get("/auth/profile"),

  forgotPassword: (data: {
    email: string;
  }): Promise<AxiosResponse<ServiceResponse>> =>
    api.post("/auth/forgot-password", data),

  resetPassword: (data: {
    token: string;
    newPassword: string;
  }): Promise<AxiosResponse<ServiceResponse>> =>
    api.post("/auth/reset-password", data),

  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<AxiosResponse<ServiceResponse>> =>
    api.put("/auth/change-password", data),
};

export const searchAPI = {
  executeSearch: (data: {
    companies: Array<{
      name: string;
      website: string;
      industry: string;
      region: string;
    }>;
    filters: {
      dateRange: {
        from: string;
        to: string;
      };
      industries: string[];
      regions: string[];
      searchName: string;
      searchType: "past" | "future" | "real-time";
    };
    selectedIndicators: string[];
    searchMode: "osint" | "api" | "both";
  }): Promise<AxiosResponse<ServiceResponse>> =>
    api.post("/searches/execute", data),

  getUserSearches: (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<AxiosResponse<ServiceResponse>> =>
    api.get("/searches", { params }),

  getSearchById: (id: string): Promise<AxiosResponse<ServiceResponse>> =>
    api.get(`/searches/${id}`),

  getSearchStatus: (id: string): Promise<AxiosResponse<ServiceResponse>> =>
    api.get(`/searches/${id}/status`),

  deleteSearch: (id: string): Promise<AxiosResponse<ServiceResponse>> =>
    api.delete(`/searches/${id}`),

  getRiskIndicators: (): Promise<AxiosResponse<ServiceResponse>> =>
    api.get("/searches/risk-indicators"),

  generateAISummary: (
    searchId: string,
    data?: { indicatorCategory?: string }
  ): Promise<AxiosResponse<ServiceResponse>> =>
    api.post(`/searches/${searchId}/ai-summary`, data),
};

export const projectAPI = {
  createProject: (data: {
    name: string;
    description?: string;
    tags?: string[];
    searchIds?: string[];
  }): Promise<AxiosResponse<ServiceResponse>> => api.post("/projects", data),

  getUserProjects: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    tags?: string;
  }): Promise<AxiosResponse<ServiceResponse>> =>
    api.get("/projects", { params }),

  getProjectById: (id: string): Promise<AxiosResponse<ServiceResponse>> =>
    api.get(`/projects/${id}`),

  updateProject: (
    id: string,
    data: { name?: string; description?: string; tags?: string[] }
  ): Promise<AxiosResponse<ServiceResponse>> =>
    api.put(`/projects/${id}`, data),

  deleteProject: (id: string): Promise<AxiosResponse<ServiceResponse>> =>
    api.delete(`/projects/${id}`),

  addSearchToProject: (
    projectId: string,
    searchId: string
  ): Promise<AxiosResponse<ServiceResponse>> =>
    api.post(`/projects/${projectId}/searches`, { searchId }),

  removeSearchFromProject: (
    projectId: string,
    searchId: string
  ): Promise<AxiosResponse<ServiceResponse>> =>
    api.delete(`/projects/${projectId}/searches/${searchId}`),
};

export const reportAPI = {
  createReport: (data: {
    title: string;
    description?: string;
    searchIds: string[];
    reportType?: string;
  }): Promise<AxiosResponse<ServiceResponse>> => api.post("/reports", data),

  generateReport: (data: {
    searchId: string;
    title?: string;
    description?: string;
    sections?: string[];
    format?: "pdf" | "html" | "json";
  }): Promise<AxiosResponse<ServiceResponse>> =>
    api.post("/reports/generate", data),

  getUserReports: (params?: {
    page?: number;
    limit?: number;
    searchId?: string;
  }): Promise<AxiosResponse<ServiceResponse>> =>
    api.get("/reports", { params }),

  getReport: (id: string): Promise<AxiosResponse<ServiceResponse>> =>
    api.get(`/reports/${id}`),

  downloadReport: (id: string): Promise<AxiosResponse<Blob>> =>
    api.get(`/reports/${id}/download`, { responseType: "blob" }),

  updateReport: (
    id: string,
    data: { title?: string; description?: string; isPublic?: boolean }
  ): Promise<AxiosResponse<ServiceResponse>> => api.put(`/reports/${id}`, data),

  deleteReport: (id: string): Promise<AxiosResponse<ServiceResponse>> =>
    api.delete(`/reports/${id}`),
};

export const alertAPI = {
  createAlert: (data: {
    searchId: string;
    alertType: string;
    frequency: string;
    isActive?: boolean;
  }): Promise<AxiosResponse<ServiceResponse>> => api.post("/alerts", data),

  getUserAlerts: (params?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
  }): Promise<AxiosResponse<ServiceResponse>> => api.get("/alerts", { params }),

  updateAlert: (
    id: string,
    data: { frequency?: string; isActive?: boolean }
  ): Promise<AxiosResponse<ServiceResponse>> => api.put(`/alerts/${id}`, data),

  deleteAlert: (id: string): Promise<AxiosResponse<ServiceResponse>> =>
    api.delete(`/alerts/${id}`),
};

export const dashboardAPI = {
  getDashboardStats: (): Promise<AxiosResponse<ServiceResponse>> =>
    api.get("/dashboard/stats"),
};

export default api;
