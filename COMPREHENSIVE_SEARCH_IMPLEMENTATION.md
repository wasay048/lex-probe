# Comprehensive Search Workflow Implementation

## Overview

This document outlines the comprehensive search workflow implementation that includes website validation, full website scraping, chunked OpenAI analysis, and transparent progress tracking.

## Workflow Architecture

### 1. Frontend New Search Page

**Location**: `frontend/src/app/dashboard/search/new/page.tsx`

**Features Implemented**:

- ✅ Limited to exactly 2 companies (validation enforced)
- ✅ All 27 risk indicators from CSV data organized in 6 categories:
  - Price Fixing (7 indicators)
  - Market Division (5 indicators)
  - Bid Rigging (5 indicators)
  - Information Exchange (4 indicators)
  - Output Restrictions (3 indicators)
  - Customer Allocation (3 indicators)
- ✅ OpenAI prompt description field for user instructions
- ✅ Form validation and error handling
- ✅ Responsive design with proper styling

### 2. Website Validation Service

**Location**: `backend/src/services/websiteValidationService.ts`

**Features Implemented**:

- ✅ Comprehensive URL validation with timeout handling
- ✅ DNS error detection and categorization
- ✅ HTTP status code validation
- ✅ Connection error handling (connection refused, timeout)
- ✅ Structured error response format
- ✅ Support for both HTTP and HTTPS protocols

**Method**: `validateWebsite(url: string)`
**Returns**:

```typescript
{
  isValid: boolean;
  status: 'valid' | 'invalid' | 'timeout' | 'dns_error' | 'connection_error';
  error?: string;
  details?: string;
  responseTime?: number;
}
```

### 3. Updated Search Controller

**Location**: `backend/src/controllers/searchController.ts`

**Enhanced Features**:

- ✅ Website validation integration before analysis
- ✅ Comprehensive 4-stage analysis workflow:
  1. **Validation Stage**: Validate all company websites
  2. **Scraping Stage**: Comprehensive website content extraction
  3. **Formatting Stage**: AI-powered data structuring with token chunking
  4. **Analysis Stage**: Comprehensive cartel risk analysis
- ✅ Background processing with real-time status updates
- ✅ Error handling and recovery mechanisms
- ✅ Progress tracking for user transparency

**New Workflow Method**: `startComprehensiveAnalysis()`

### 4. Enhanced Cartel Analysis Service

**Location**: `backend/src/services/cartelAnalysisService.ts`

**New Methods Added**:

#### `comprehensiveWebsiteScraping(companies[])`

- ✅ Comprehensive website content extraction
- ✅ Integration with existing scraping service
- ✅ News data collection
- ✅ Structured data collection with timestamps
- ✅ Error handling for failed scraping attempts

#### `formatScrapedDataWithAI(scrapingResults[])`

- ✅ AI-powered data formatting with OpenAI GPT-4o-mini
- ✅ Token chunking for large content (15k token limit per chunk)
- ✅ Structured JSON extraction from raw scraped content
- ✅ Company-specific data processing
- ✅ Chunk merging for comprehensive company profiles
- ✅ Fallback handling for parsing errors

**Formatted Data Structure**:

```typescript
{
  companyInfo: { name, industry, description },
  pricing: { pricingModel, prices[], pricingChanges[] },
  businessPractices: { marketStrategy, competitorMentions[], partnerships[] },
  news: { recentNews[], announcements[], marketEvents[] },
  keyTopics: string[]
}
```

#### `performCartelAnalysis(formattedData[], indicators[], description, companies[])`

- ✅ Comprehensive cartel risk analysis using formatted data
- ✅ CSV indicator data integration with full modus operandi details
- ✅ Token chunking for large analysis prompts (20k token limit)
- ✅ Risk score calculation (0-100 scale)
- ✅ Alert level determination (LOW/MEDIUM/HIGH/CRITICAL)
- ✅ Cross-company correlation analysis
- ✅ Evidence-based findings with specific citations
- ✅ Actionable recommendations

**Analysis Output Structure**:

```typescript
{
  overallRiskScore: 0-100,
  alertLevel: "LOW|MEDIUM|HIGH|CRITICAL",
  companiesAnalysis: [{
    company: string,
    individualRiskScore: 0-100,
    indicators: {
      [indicatorId]: {
        detected: boolean,
        confidence: 0-100,
        evidence: string[],
        analysis: string
      }
    }
  }],
  crossCompanyAnalysis: {
    coordinationPatterns: string[],
    priceCorrelation: 0-100,
    marketDivision: 0-100,
    communicationIndicators: 0-100
  },
  keyFindings: string[],
  recommendations: string[],
  evidenceSummary: string
}
```

### 5. Updated Search Service

**Location**: `backend/src/services/searchService.ts`

**Enhancements**:

- ✅ Added `description` field to `CreateSearchRequest` interface
- ✅ Added `updateSearchResults()` method for compatibility
- ✅ Maintained existing functionality for search management

## AI Integration Strategy

### Multi-Agent Approach

1. **Scraping Agent**: Comprehensive website content extraction
2. **Formatting Agent**: Structured data extraction from raw content
3. **Analysis Agent**: Risk assessment and cartel detection

### Token Management

- **Chunking Strategy**: 15k tokens for formatting, 20k tokens for analysis
- **Content Splitting**: Word-based chunking with context preservation
- **Merge Strategy**: Intelligent consolidation of chunk results
- **Fallback Handling**: Graceful degradation for parsing failures

### OpenAI Integration

- **Model**: GPT-4o-mini for cost-effective analysis
- **Temperature**: 0.1 for consistent, factual responses
- **Max Tokens**: 4000 per response to ensure detailed analysis
- **Error Handling**: Retry logic and fallback responses

## Progress Tracking Implementation

### Status Updates

- `validation_in_progress` → Website validation phase
- `scraping_in_progress` → Comprehensive data collection
- `formatting_in_progress` → AI-powered data structuring  
- `analysis_in_progress` → Final cartel risk assessment
- `completed` → Analysis finished with results
- `failed` → Error occurred with details

### Real-Time Updates

- Database status updates at each stage
- Background processing with non-blocking UI
- Error reporting with detailed diagnostics
- Progress percentage tracking (planned)

## Risk Indicator Integration

### CSV Data Integration

- ✅ All 27 indicators loaded from original CSV structure
- ✅ Full modus operandi descriptions included
- ✅ Evidence types and digital evidence integration
- ✅ Agentic AI search strategies incorporated
- ✅ Risk scoring aligned with CSV weights

### Categories Covered

1. **Price Fixing** (7 indicators)
2. **Market Division** (5 indicators)
3. **Bid Rigging** (5 indicators)
4. **Information Exchange** (4 indicators)
5. **Output Restrictions** (3 indicators)
6. **Customer Allocation** (3 indicators)

## Testing Strategy

### Test Coverage

- ✅ Website validation unit tests
- ✅ Workflow integration tests
- ✅ Method existence verification
- 🔄 Full end-to-end testing (pending)
- 🔄 Performance testing with large datasets
- 🔄 Error handling stress testing

## Deployment Considerations

### Environment Setup

- ✅ OpenAI API key configuration
- ✅ Database connection for search management
- ✅ Timeout configurations for external requests
- ✅ Error logging and monitoring

### Performance Optimization

- ✅ Chunked processing for large content
- ✅ Parallel processing where possible
- ✅ Background job processing
- 🔄 Caching for repeated analyses
- 🔄 Rate limiting for API calls

## Usage Instructions

### Frontend Usage

1. Navigate to `/dashboard/search/new`
2. Enter exactly 2 company names and websites
3. Select relevant risk indicators from the 6 categories
4. Provide OpenAI analysis instructions in the description field
5. Submit search to start comprehensive analysis

### API Usage

```typescript
POST /api/search
{
  companies: [
    { name: "Company A", website: "https://example.com" },
    { name: "Company B", website: "https://example2.com" }
  ],
  selectedIndicators: [
    { id: "price_fixing_identical", category: "Price Fixing" }
  ],
  description: "Analyze these companies for potential cartel behavior"
}
```

## Technical Specifications

- **TypeScript**: Full type safety with proper interfaces
- **Error Handling**: Comprehensive try-catch with logging
- **Validation**: Input validation at multiple levels
- **Scalability**: Chunked processing for large datasets
- **Monitoring**: Detailed logging and status tracking
- **Security**: Input sanitization and API key protection

## Future Enhancements

- 🔄 Progress percentage tracking
- 🔄 Real-time websocket updates
- 🔄 Caching for improved performance
- 🔄 Advanced visualization of results
- 🔄 Export functionality for reports
- 🔄 Historical comparison capabilities
