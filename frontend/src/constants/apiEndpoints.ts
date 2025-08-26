const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/v1/auth/login`,
    REGISTER: `${API_BASE_URL}/api/v1/auth/register`,
  },
  DEMO_REQUESTS: {
    SUBMIT: `${API_BASE_URL}/api/v1/demo-requests`,
    GET_ALL: `${API_BASE_URL}/api/v1/demo-requests`,
    GET_BY_ID: (id: string) => `${API_BASE_URL}/api/v1/demo-requests/${id}`,
    UPDATE: (id: string) => `${API_BASE_URL}/api/v1/demo-requests/${id}`,
    CHECK_ELIGIBILITY: `${API_BASE_URL}/api/v1/demo-requests/check-eligibility`,
    STATS: `${API_BASE_URL}/api/v1/demo-requests/stats`,
  },
  SEARCH: {
    EXECUTE: `${API_BASE_URL}/api/search/execute`,
    GET_RESULTS: `${API_BASE_URL}/api/search/results`,
  },
  PROJECT: {
    CREATE: `${API_BASE_URL}/api/projects/create`,
    GET_ALL: `${API_BASE_URL}/api/projects`,
  },
  ALERT: {
    CREATE: `${API_BASE_URL}/api/alerts/create`,
    GET_ALL: `${API_BASE_URL}/api/alerts`,
  },
  REPORT: {
    GENERATE: `${API_BASE_URL}/api/reports/generate`,
    GET_ALL: `${API_BASE_URL}/api/reports`,
  },
};
