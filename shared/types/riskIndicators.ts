export interface RiskIndicator {
    id: string;
    category: string;
    indicator: string;
    riskScore: number; // Scale from 1 to 5
    modusOperandi: string;
    typesOfEvidence: string[];
    modernDigitalCollusionTechniques: string;
    digitalEvidenceToInvestigate: string;
    agenticAISearchStrategy: string;
    webResourcesForAIScraping: string[];
    topInternetSourcesForAgenticAI: string[];
    openSourceTools: string[];
    apiIntelligenceTools: string[];
    mvp: boolean; // Indicates if this indicator is part of the MVP
}