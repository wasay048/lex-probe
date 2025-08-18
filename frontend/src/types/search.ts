export interface SearchRequest {
  companyNames: string[];
  website: string;
  industry?: string;
  dateOfSearch?: Date;
  riskIndicators: string[];
  searchType: 'openSource' | 'advanced';
}

export interface SearchResult {
  companyName: string;
  website: string;
  riskScore: number;
  indicators: {
    [key: string]: boolean;
  };
  summary: string;
}

export interface RiskIndicator {
  id: string;
  description: string;
  category: string;
}