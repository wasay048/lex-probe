export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

export interface RiskIndicator {
    id: string;
    name: string;
    description: string;
    category: string;
}

export interface SearchResult {
    id: string;
    companyName: string;
    website: string;
    riskIndicators: RiskIndicator[];
}

export interface Project {
    id: string;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
}

export interface Alert {
    id: string;
    title: string;
  description: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'resolved';
}

export interface Report {
    id: string;
    title: string;
    content: string;
    createdAt: string;
}