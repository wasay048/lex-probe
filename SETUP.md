# Cartel Detection Platform - Setup Instructions

## Quick Start Guide

### Prerequisites

1. **Node.js** (v18 or higher)
2. **MongoDB** (v5.0 or higher)
3. **Redis** (v6.0 or higher)
4. **OpenAI API Key** (for AI-powered cartel analysis)

### Backend Setup

1. **Navigate to backend directory**:

   ```bash
   cd backend
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Configure environment variables**:

   ```bash
   copy .env.example .env
   ```

   **IMPORTANT**: Update the following variables in your `.env` file:
   - `OPENAI_API_KEY`: Your OpenAI API key (required for cartel analysis)
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Strong secret key (minimum 32 characters)
   - `JWT_REFRESH_SECRET`: Strong refresh secret key (minimum 32 characters)
   - `SMTP_*`: Email configuration for notifications

4. **Start the backend server**:

   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to frontend directory**:

   ```bash
   cd frontend
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Start the frontend development server**:

   ```bash
   npm run dev
   ```

### AI-Powered Cartel Detection Features

The platform now includes advanced AI capabilities using OpenAI:

#### What the AI Does

1. **Intelligent Web Scraping**: Automatically scrapes company websites, news articles, and financial data
2. **Pattern Recognition**: Uses GPT-4 to identify cartel behavior patterns across multiple companies
3. **Cross-Company Analysis**: Analyzes correlations between companies for:
   - Price coordination patterns
   - Market division indicators
   - Communication patterns
   - Bid coordination signs

#### How It Works

1. **User submits search** with companies and selected risk indicators
2. **Background AI analysis** automatically:
   - Scrapes company websites for pricing and business information
   - Searches for relevant news articles about the companies
   - Gathers financial data and market information
   - Uses OpenAI GPT-4 to analyze all data for cartel indicators
   - Generates comprehensive risk assessment and recommendations

#### Key Features

- **Real-time Analysis**: Processing happens in background while user can continue working
- **Comprehensive Reporting**: Detailed analysis of each company and cross-company patterns
- **Risk Scoring**: Automated risk scores from 0-100 with alert levels (LOW/MEDIUM/HIGH/CRITICAL)
- **Evidence-Based**: AI provides specific evidence and reasoning for each indicator
- **Actionable Insights**: Clear recommendations for further investigation

### API Endpoints

#### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token

#### Search & Analysis

- `POST /api/search` - Create new cartel detection search (triggers AI analysis)
- `GET /api/search` - Get user's searches
- `GET /api/search/:id` - Get specific search results

### Environment Variables Explained

```bash
# Core Configuration
NODE_ENV=development
PORT=5000

# Database & Cache
MONGODB_URI=mongodb://localhost:27017/cartel-detection-platform
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_REFRESH_SECRET=your-super-secret-refresh-key-minimum-32-characters-long

# AI Integration (REQUIRED)
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### Sample Usage

1. **Register/Login** to the platform
2. **Navigate to Search** → "New Search"
3. **Add companies** you want to analyze (name, website, industry)
4. **Select risk indicators** from categories like:
   - Price Fixing
   - Market Division
   - Bid Rigging
   - Output Restrictions
   - Customer Allocation
   - Information Exchange
5. **Submit search** - AI analysis runs automatically in background
6. **View results** with detailed risk assessment and recommendations

### Architecture

- **Frontend**: Next.js 14 with TypeScript and TailwindCSS
- **Backend**: Node.js with Express and TypeScript
- **Database**: MongoDB for data storage
- **Cache**: Redis for session management
- **AI**: OpenAI GPT-4 for intelligent cartel detection
- **Architecture**: Clean 3-layer architecture (Controller → Service → Repository)

### Development

- **Frontend URL**: <http://localhost:3000>
- **Backend URL**: <http://localhost:5000>
- **API Documentation**: Available at <http://localhost:5000/api-docs> (coming soon)

### Troubleshooting

1. **MongoDB Connection Issues**: Ensure MongoDB is running and connection string is correct
2. **OpenAI API Errors**: Verify your API key has sufficient credits and permissions
3. **CORS Issues**: Ensure CORS_ORIGIN matches your frontend URL
4. **Authentication Issues**: Check JWT secrets are properly configured

### Next Steps

After setup:

1. Create test searches with real companies
2. Monitor AI analysis results
3. Review generated reports and recommendations
4. Adjust risk thresholds based on your requirements

The platform is designed to be functional immediately with intelligent AI-powered cartel detection capabilities.
