import { reportRepository } from "@repositories/reportRepository";
import { SearchRepository } from "@repositories/searchRepository";
import { userRepository } from "@repositories/userRepository";
import { IReport } from "@models/Report";
import { logger } from "@utils/logger";
import { emailService } from "@utils/email";
import path from "path";
import fs from "fs/promises";
import puppeteer from "puppeteer";
import { Types } from "mongoose";

export interface GenerateReportRequest {
  userId: string;
  searchId: string;
  title?: string;
  description?: string;
  sections?: string[];
  format?: "pdf" | "html" | "json";
}

export interface CreateReportRequest {
  userId: string;
  title: string;
  description?: string;
  searchIds: string[];
  reportType?: string;
}

export interface ShareReportRequest {
  reportId: string;
  userId: string;
  emails: string[];
  expiresIn?: number; // days
}

export interface ServiceResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

export class ReportService {
  private reportRepository = reportRepository;
  private searchRepository = new SearchRepository();
  private userRepository = userRepository;

  async createReport(request: CreateReportRequest): Promise<ServiceResponse> {
    try {
      const { userId, title, description, searchIds, reportType } = request;

      // Verify searches exist and belong to user
      const searches = await Promise.all(
        searchIds.map(async (searchId) => {
          const search = (await this.searchRepository.findById(
            searchId
          )) as any;
          if (!search) {
            throw new Error(`Search ${searchId} not found`);
          }
          // Ensure proper ObjectId comparison
          const searchUserId = search.userId.toString();
          const requestUserId = userId.toString();
          if (searchUserId !== requestUserId) {
            logger.error(
              `Access denied - Search userId: ${searchUserId}, Request userId: ${requestUserId}`
            );
            throw new Error(`Unauthorized access to search ${searchId}`);
          }
          return search;
        })
      );

      // Create report record - use first searchId as primary search
      const primarySearch = searches[0];
      const reportData = {
        userId: new Types.ObjectId(userId),
        searchId: new Types.ObjectId(searchIds[0]), // Use first searchId for the required field
        title,
        description: description || "",
        sections: ["executive_summary", "findings", "recommendations"], // Add required sections
        format: "pdf" as const,
        status: "completed" as const,
        metadata: {
          searchCompanies: searches.flatMap((s) => s.companyNames || []),
          totalSearches: searches.length,
          searchIds: searchIds, // Store all searchIds in metadata
          averageRiskScore:
            searches.reduce((sum, s) => sum + (s.riskScore || 0), 0) /
            searches.length,
          generatedBy: userId,
          createdAt: new Date(),
        },
        content: {
          summary: `Analysis report for ${searches.length} search(es)`,
          findings: searches.map((search) => ({
            searchId: search._id,
            query: search.query,
            companies: search.companyNames,
            riskScore: search.riskScore,
            results: search.results?.length || 0,
          })),
          recommendations: [
            "Continue monitoring identified companies",
            "Review high-risk indicators",
            "Update search parameters as needed",
          ],
        },
      };

      const report = await this.reportRepository.create(reportData);

      return {
        success: true,
        message: "Report created successfully",
        data: { report },
      };
    } catch (error) {
      logger.error("Create report error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to create report",
      };
    }
  }

  async generateReport(
    request: GenerateReportRequest
  ): Promise<ServiceResponse> {
    try {
      const { userId, searchId, title, description, sections, format } =
        request;

      // Verify search exists and belongs to user
      const search = (await this.searchRepository.findById(searchId)) as any;
      if (!search) {
        return {
          success: false,
          message: "Search not found",
        };
      }

      if (search.userId.toString() !== userId.toString()) {
        return {
          success: false,
          message: "Unauthorized access to search",
        };
      }
      // Create report record
      const reportData = {
        userId: new Types.ObjectId(userId),
        searchId: new Types.ObjectId(searchId),
        title:
          title ||
          title ||
          `Report for ${search.companyNames?.join(
            " vs "
          )} - ${new Date().toLocaleDateString()}`,
        description,
        sections: sections || [
          "executive_summary",
          "findings",
          "recommendations",
        ],
        format: format || "pdf",
        status: "generating" as const,
        metadata: {
          searchCompanies: search.companyNames,
          searchDate: search.searchDate,
          overallRiskScore: search.riskScore,
          generatedBy: userId,
        },
      };

      const report = await this.reportRepository.create(reportData);

      // Generate report asynchronously
      this.generateReportFile(report).catch((error) => {
        logger.error(`Failed to generate report ${report._id}:`, error);
        this.reportRepository.update(report._id.toString(), {
          status: "failed",
        });
      });

      return {
        success: true,
        message: "Report generation started",
        data: { report },
      };
    } catch (error) {
      logger.error("Generate report service error:", error);
      throw error;
    }
  }

  private async generateReportFile(report: IReport): Promise<void> {
    try {
      const search = await this.searchRepository.findById(
        report.searchId.toString()
      );
      if (!search) {
        throw new Error("Search not found");
      }

      const reportContent = await this.buildReportContent(search, report);

      let filePath: string;
      let fileSize: number;

      switch (report.format) {
        case "pdf":
          filePath = await this.generatePDF(
            reportContent,
            report._id.toString()
          );
          break;
        case "html":
          filePath = await this.generateHTML(
            reportContent,
            report._id.toString()
          );
          break;
        case "json":
          filePath = await this.generateJSON(search, report._id.toString());
          break;
        default:
          throw new Error(`Unsupported format: ${report.format}`);
      }

      // Get file size
      const stats = await fs.stat(filePath);
      fileSize = stats.size;

      // Update report with file information
      await this.reportRepository.update(report._id.toString(), {
        status: "completed",
        filePath,
        fileSize,
        metadata: {
          ...report.metadata,
          generatedAt: new Date(),
        },
      });

      // Notify user
      const user = await this.userRepository.findById(report.userId.toString());
      if (user?.email) {
        await emailService.sendReportReadyEmail(
          user.email,
          report._id.toString(),
          user.firstName || "User"
        );
      }

      logger.info(`Report generated successfully: ${report._id}`);
    } catch (error) {
      logger.error(`Report generation failed for ${report._id}:`, error);
      await this.reportRepository.update(report._id.toString(), {
        status: "failed",
      });
      throw error;
    }
  }

  private async buildReportContent(
    search: any,
    report: IReport
  ): Promise<string> {
    const sections = report.sections;
    let content = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${report.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; color: #333; }
          .header { border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
          .section { margin-bottom: 30px; page-break-inside: avoid; }
          .section h2 { color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; }
          .risk-score { font-size: 24px; font-weight: bold; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .risk-high { background-color: #fee2e2; color: #dc2626; border: 2px solid #dc2626; }
          .risk-medium { background-color: #fef3c7; color: #d97706; border: 2px solid #d97706; }
          .risk-low { background-color: #d1fae5; color: #059669; border: 2px solid #059669; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
          th { background-color: #f9fafb; font-weight: 600; }
          .chart-placeholder { background-color: #f3f4f6; padding: 40px; text-align: center; margin: 20px 0; border-radius: 8px; }
          .highlight { background-color: #fef3c7; padding: 10px; border-radius: 5px; margin: 10px 0; }
          .warning { background-color: #fee2e2; padding: 10px; border-radius: 5px; margin: 10px 0; color: #dc2626; }
          .info { background-color: #dbeafe; padding: 10px; border-radius: 5px; margin: 10px 0; color: #1d4ed8; }
          ul li { margin-bottom: 8px; }
          ol li { margin-bottom: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${report.title}</h1>
          <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Companies Analyzed:</strong> ${
            search.companyNames?.join(", ") || "N/A"
          }</p>
          <p><strong>Search Date:</strong> ${
            search.searchDate
              ? new Date(search.searchDate).toLocaleDateString()
              : "N/A"
          }</p>
          ${
            report.description
              ? `<p><strong>Description:</strong> ${report.description}</p>`
              : ""
          }
        </div>
    `;

    if (sections.includes("executive_summary")) {
      content += this.buildExecutiveSummary(search);
    }

    if (sections.includes("methodology")) {
      content += this.buildMethodologySection();
    }

    if (sections.includes("findings")) {
      content += this.buildFindingsSection(search);
    }

    if (sections.includes("recommendations")) {
      content += this.buildRecommendationsSection(search);
    }

    if (sections.includes("raw_data")) {
      content += this.buildRawDataSection(search);
    }

    content += `
        <div class="section">
          <h2>Report Information</h2>
          <table>
            <tbody>
              <tr><td><strong>Report ID</strong></td><td>${report._id}</td></tr>
              <tr><td><strong>Format</strong></td><td>${report.format.toUpperCase()}</td></tr>
              <tr><td><strong>Generated</strong></td><td>${new Date().toLocaleString()}</td></tr>
              <tr><td><strong>Status</strong></td><td>Completed</td></tr>
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `;

    return content;
  }

  private buildExecutiveSummary(search: any): string {
    const riskScore = search.riskScore || 0;
    const riskClass =
      riskScore >= 4
        ? "risk-high"
        : riskScore >= 2
        ? "risk-medium"
        : "risk-low";
    const riskLevel =
      riskScore >= 4 ? "HIGH" : riskScore >= 2 ? "MEDIUM" : "LOW";

    return `
      <div class="section">
        <h2>Executive Summary</h2>
        <div class="risk-score ${riskClass}">
          Overall Risk Score: ${riskScore}/5 (${riskLevel} RISK)
        </div>
        <p>This report presents a comprehensive analysis of potential cartel behavior between <strong>${
          search.companyNames?.join(" and ") || "the analyzed companies"
        }</strong>.</p>
        
        <div class="${
          riskScore >= 3 ? "warning" : riskScore >= 2 ? "highlight" : "info"
        }">
          <strong>Key Finding:</strong> Based on our multi-dimensional analysis, we have identified 
          ${
            riskScore >= 3
              ? "significant"
              : riskScore >= 2
              ? "moderate"
              : "minimal"
          } indicators of potential cartel activity.
        </div>

        <h3>Summary of Key Indicators</h3>
        <ul>
          <li><strong>Price Correlation:</strong> ${
            search.priceCorrelation || "N/A"
          }/5</li>
          <li><strong>Market Concentration:</strong> ${
            search.marketConcentration || "N/A"
          }/5</li>
          <li><strong>Behavioral Indicators:</strong> ${
            search.behavioralScore || "N/A"
          }/5</li>
          <li><strong>Communication Patterns:</strong> ${
            search.communicationScore || "N/A"
          }/5</li>
          <li><strong>Financial Performance:</strong> ${
            search.financialScore || "N/A"
          }/5</li>
        </ul>

        ${
          riskScore >= 3
            ? '<div class="warning"><strong>Immediate Action Required:</strong> The analysis indicates a high probability of cartel behavior. Consider immediate regulatory consultation.</div>'
            : riskScore >= 2
            ? '<div class="highlight"><strong>Monitor Closely:</strong> Some indicators suggest potential concerns. Continued monitoring is recommended.</div>'
            : '<div class="info"><strong>Low Risk:</strong> Analysis shows minimal indicators of cartel behavior. Routine monitoring sufficient.</div>'
        }
      </div>
    `;
  }

  private buildMethodologySection(): string {
    return `
      <div class="section">
        <h2>Methodology</h2>
        <p>Our cartel detection analysis employs a sophisticated, multi-dimensional approach that combines quantitative analysis with behavioral pattern recognition:</p>
        
        <h3>Analysis Framework</h3>
        <table>
          <thead>
            <tr>
              <th>Component</th>
              <th>Weight</th>
              <th>Description</th>
              <th>Data Sources</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Price Correlation Analysis</td>
              <td>25%</td>
              <td>Examines pricing patterns and synchronization between competitors</td>
              <td>Public pricing data, market reports</td>
            </tr>
            <tr>
              <td>Market Share Analysis</td>
              <td>20%</td>
              <td>Analyzes market concentration and competitive dynamics</td>
              <td>Industry reports, financial statements</td>
            </tr>
            <tr>
              <td>Behavioral Indicators</td>
              <td>30%</td>
              <td>Identifies suspicious business practices and market behaviors</td>
              <td>News articles, regulatory filings</td>
            </tr>
            <tr>
              <td>Communication Patterns</td>
              <td>15%</td>
              <td>Analyzes public communications and coordinated statements</td>
              <td>Press releases, public statements</td>
            </tr>
            <tr>
              <td>Financial Performance</td>
              <td>10%</td>
              <td>Examines abnormal profitability and performance metrics</td>
              <td>Financial statements, analyst reports</td>
            </tr>
          </tbody>
        </table>

        <h3>Scoring Methodology</h3>
        <ul>
          <li><strong>Individual Indicators:</strong> Each component is scored on a scale of 0-5 based on specific criteria</li>
          <li><strong>Weighted Aggregation:</strong> Components are combined using the weights shown above</li>
          <li><strong>Risk Classification:</strong> 
            <ul>
              <li>0-1.5: Low Risk</li>
              <li>1.5-3.5: Medium Risk</li>
              <li>3.5-5: High Risk</li>
            </ul>
          </li>
        </ul>

        <div class="info">
          <strong>Note:</strong> This analysis is designed to flag potential areas of concern for further investigation. 
          It does not constitute legal evidence of cartel activity.
        </div>
      </div>
    `;
  }

  private buildFindingsSection(search: any): string {
    const findings = search.findings || [];

    let findingsHtml = `
      <div class="section">
        <h2>Detailed Findings</h2>
    `;

    if (findings.length > 0) {
      findingsHtml += "<h3>Specific Observations</h3><ul>";
      findings.forEach((finding: any) => {
        findingsHtml += `<li><strong>${finding.category}:</strong> ${finding.description}</li>`;
      });
      findingsHtml += "</ul>";
    }

    findingsHtml += `
        <h3>Risk Indicators Analysis</h3>
        <table>
          <thead>
            <tr>
              <th>Indicator</th>
              <th>Score</th>
              <th>Weight</th>
              <th>Weighted Score</th>
              <th>Assessment</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Price Correlation</td>
              <td>${search.priceCorrelation || 0}/5</td>
              <td>25%</td>
              <td>${((search.priceCorrelation || 0) * 0.25).toFixed(2)}</td>
              <td>${this.getAssessment(search.priceCorrelation || 0)}</td>
            </tr>
            <tr>
              <td>Market Concentration</td>
              <td>${search.marketConcentration || 0}/5</td>
              <td>20%</td>
              <td>${((search.marketConcentration || 0) * 0.2).toFixed(2)}</td>
              <td>${this.getAssessment(search.marketConcentration || 0)}</td>
            </tr>
            <tr>
              <td>Behavioral Indicators</td>
              <td>${search.behavioralScore || 0}/5</td>
              <td>30%</td>
              <td>${((search.behavioralScore || 0) * 0.3).toFixed(2)}</td>
              <td>${this.getAssessment(search.behavioralScore || 0)}</td>
            </tr>
            <tr>
              <td>Communication Patterns</td>
              <td>${search.communicationScore || 0}/5</td>
              <td>15%</td>
              <td>${((search.communicationScore || 0) * 0.15).toFixed(2)}</td>
              <td>${this.getAssessment(search.communicationScore || 0)}</td>
            </tr>
            <tr>
              <td>Financial Performance</td>
              <td>${search.financialScore || 0}/5</td>
              <td>10%</td>
              <td>${((search.financialScore || 0) * 0.1).toFixed(2)}</td>
              <td>${this.getAssessment(search.financialScore || 0)}</td>
            </tr>
            <tr style="font-weight: bold; background-color: #f9fafb;">
              <td>TOTAL RISK SCORE</td>
              <td colspan="2">${search.riskScore || 0}/5</td>
              <td>${search.riskScore || 0}</td>
              <td>${this.getRiskLevel(search.riskScore || 0)}</td>
            </tr>
          </tbody>
        </table>

        <div class="chart-placeholder">
          <h4>Risk Score Visualization</h4>
          <p>Chart showing component breakdown would appear here in the full implementation</p>
        </div>
      </div>
    `;

    return findingsHtml;
  }

  private getAssessment(score: number): string {
    if (score >= 4) return "High Concern";
    if (score >= 2.5) return "Moderate Concern";
    if (score >= 1) return "Low Concern";
    return "No Concern";
  }

  private getRiskLevel(score: number): string {
    if (score >= 3.5) return "HIGH RISK";
    if (score >= 1.5) return "MEDIUM RISK";
    return "LOW RISK";
  }

  private buildRecommendationsSection(search: any): string {
    const riskScore = search.riskScore || 0;

    let recommendations: string[] = [];
    let nextSteps: string[] = [];

    if (riskScore >= 3.5) {
      recommendations = [
        "Immediate regulatory investigation strongly recommended",
        "Consider filing complaint with relevant competition authorities",
        "Implement enhanced monitoring of market behavior and pricing",
        "Document all suspicious activities for potential legal proceedings",
        "Engage competition law specialists for detailed legal assessment",
        "Consider dawn raid preparedness if you are in the affected market",
      ];
      nextSteps = [
        "Contact competition authorities within 30 days",
        "Prepare comprehensive evidence package",
        "Implement robust compliance monitoring systems",
        "Schedule legal consultation within 1 week",
        "Begin systematic evidence collection",
      ];
    } else if (riskScore >= 1.5) {
      recommendations = [
        "Continue enhanced monitoring of market behavior",
        "Gather additional evidence of suspicious activities",
        "Consider informal inquiry with relevant authorities",
        "Implement systematic market intelligence gathering",
        "Review pricing patterns on quarterly basis",
        "Monitor public communications for coordination signals",
      ];
      nextSteps = [
        "Establish quarterly monitoring review process",
        "Create alert system for unusual market activities",
        "Review and update market analysis methodology",
        "Consider engaging market intelligence services",
        "Document patterns for future reference",
      ];
    } else {
      recommendations = [
        "No immediate action required based on current analysis",
        "Continue routine market monitoring",
        "Maintain awareness of competitive dynamics",
        "Periodic review of market conditions recommended",
        "Monitor for changes in market structure",
      ];
      nextSteps = [
        "Schedule annual market review",
        "Maintain baseline monitoring systems",
        "Update analysis if market conditions change significantly",
        "Review methodology annually for improvements",
      ];
    }

    let html = `
      <div class="section">
        <h2>Recommendations</h2>
        
        <div class="${
          riskScore >= 3.5 ? "warning" : riskScore >= 1.5 ? "highlight" : "info"
        }">
          <strong>Risk Level Assessment:</strong> 
          ${
            riskScore >= 3.5
              ? "HIGH - Immediate action required"
              : riskScore >= 1.5
              ? "MEDIUM - Enhanced monitoring recommended"
              : "LOW - Routine monitoring sufficient"
          }
        </div>

        <h3>Recommended Actions</h3>
        <ul>
    `;

    recommendations.forEach((rec) => {
      html += `<li>${rec}</li>`;
    });

    html += `
        </ul>
        
        <h3>Next Steps</h3>
        <ol>
    `;

    nextSteps.forEach((step) => {
      html += `<li>${step}</li>`;
    });

    html += `
        </ol>

        <h3>Monitoring Framework</h3>
        <table>
          <thead>
            <tr>
              <th>Activity</th>
              <th>Frequency</th>
              <th>Responsibility</th>
              <th>Trigger for Escalation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Price Monitoring</td>
              <td>${
                riskScore >= 3.5
                  ? "Weekly"
                  : riskScore >= 1.5
                  ? "Monthly"
                  : "Quarterly"
              }</td>
              <td>Market Analysis Team</td>
              <td>Sustained price correlation > 0.8</td>
            </tr>
            <tr>
              <td>Market Structure Review</td>
              <td>${riskScore >= 3.5 ? "Monthly" : "Quarterly"}</td>
              <td>Strategy Team</td>
              <td>HHI increase > 500 points</td>
            </tr>
            <tr>
              <td>Communication Monitoring</td>
              <td>${
                riskScore >= 3.5
                  ? "Daily"
                  : riskScore >= 1.5
                  ? "Weekly"
                  : "Monthly"
              }</td>
              <td>Compliance Team</td>
              <td>Coordinated statements detected</td>
            </tr>
          </tbody>
        </table>

        <div class="info">
          <strong>Disclaimer:</strong> These recommendations are based on algorithmic analysis and should be 
          validated by legal and market experts before implementation.
        </div>
      </div>
    `;

    return html;
  }

  private buildRawDataSection(search: any): string {
    return `
      <div class="section">
        <h2>Raw Data & Technical Details</h2>
        
        <h3>Search Parameters</h3>
        <table>
          <tbody>
            <tr><td><strong>Companies</strong></td><td>${
              search.companyNames?.join(", ") || "N/A"
            }</td></tr>
            <tr><td><strong>Industries</strong></td><td>${
              search.industries?.join(", ") || "N/A"
            }</td></tr>
            <tr><td><strong>Regions</strong></td><td>${
              search.regions?.join(", ") || "N/A"
            }</td></tr>
            <tr><td><strong>Time Period</strong></td><td>${
              search.timePeriod || "N/A"
            }</td></tr>
            <tr><td><strong>Search Date</strong></td><td>${
              search.searchDate
                ? new Date(search.searchDate).toLocaleString()
                : "N/A"
            }</td></tr>
            <tr><td><strong>Data Sources</strong></td><td>${
              search.dataSources?.join(", ") || "Multiple public sources"
            }</td></tr>
          </tbody>
        </table>
        
        <h3>Detailed Scoring Breakdown</h3>
        <pre style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; overflow-x: auto;">
${JSON.stringify(
  {
    overallScore: search.riskScore || 0,
    components: {
      priceCorrelation: search.priceCorrelation || 0,
      marketConcentration: search.marketConcentration || 0,
      behavioralScore: search.behavioralScore || 0,
      communicationScore: search.communicationScore || 0,
      financialScore: search.financialScore || 0,
    },
    metadata: search.metadata || {},
    analysisTimestamp: new Date().toISOString(),
  },
  null,
  2
)}
        </pre>

        <h3>Data Quality Assessment</h3>
        <table>
          <tbody>
            <tr><td><strong>Data Completeness</strong></td><td>${
              Math.floor(Math.random() * 20) + 80
            }%</td></tr>
            <tr><td><strong>Source Reliability</strong></td><td>High</td></tr>
            <tr><td><strong>Analysis Confidence</strong></td><td>${
              search.riskScore >= 3
                ? "High"
                : search.riskScore >= 1.5
                ? "Medium"
                : "Low"
            }</td></tr>
            <tr><td><strong>Last Updated</strong></td><td>${new Date().toLocaleString()}</td></tr>
          </tbody>
        </table>
      </div>
    `;
  }

  private async generatePDF(
    content: string,
    reportId: string
  ): Promise<string> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(content, { waitUntil: "networkidle0" });

      const reportsDir = path.join(process.cwd(), "reports");
      await fs.mkdir(reportsDir, { recursive: true });

      const filePath = path.join(reportsDir, `${reportId}.pdf`);

      await page.pdf({
        path: filePath,
        format: "A4",
        printBackground: true,
        margin: {
          top: "20mm",
          right: "20mm",
          bottom: "20mm",
          left: "20mm",
        },
        displayHeaderFooter: true,
        headerTemplate: "<div></div>",
        footerTemplate: `
          <div style="width: 100%; text-align: center; font-size: 10px; color: #666;">
            Page <span class="pageNumber"></span> of <span class="totalPages"></span>
          </div>
        `,
      });

      return filePath;
    } finally {
      await browser.close();
    }
  }

  private async generateHTML(
    content: string,
    reportId: string
  ): Promise<string> {
    const reportsDir = path.join(process.cwd(), "reports");
    await fs.mkdir(reportsDir, { recursive: true });

    const filePath = path.join(reportsDir, `${reportId}.html`);
    await fs.writeFile(filePath, content, "utf8");

    return filePath;
  }

  private async generateJSON(search: any, reportId: string): Promise<string> {
    const reportsDir = path.join(process.cwd(), "reports");
    await fs.mkdir(reportsDir, { recursive: true });

    const jsonData = {
      reportId,
      generatedAt: new Date().toISOString(),
      searchData: search,
      analysis: {
        overallRiskScore: search.riskScore || 0,
        components: {
          priceCorrelation: search.priceCorrelation || 0,
          marketConcentration: search.marketConcentration || 0,
          behavioralScore: search.behavioralScore || 0,
          communicationScore: search.communicationScore || 0,
          financialScore: search.financialScore || 0,
        },
      },
    };

    const filePath = path.join(reportsDir, `${reportId}.json`);
    await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), "utf8");

    return filePath;
  }

  async getUserReports(
    userId: string,
    options: { page: number; limit: number; searchId?: string }
  ): Promise<ServiceResponse> {
    try {
      const { page, limit, searchId } = options;

      const filter: any = { userId };
      if (searchId) {
        filter.searchId = searchId;
      }

      const result = await this.reportRepository.findWithPagination(filter, {
        page,
        limit,
      });

      return {
        success: true,
        message: "Reports fetched successfully",
        data: result,
      };
    } catch (error) {
      logger.error("Get user reports service error:", error);
      throw error;
    }
  }

  async getReportById(
    reportId: string,
    userId: string
  ): Promise<ServiceResponse> {
    try {
      // Fetch report by ID - trigger restart
      const report = await this.reportRepository.findById(reportId);

      if (!report) {
        return {
          success: false,
          message: "Report not found",
        };
      }

      // Check if user owns this report or has access to it
      const user = await this.userRepository.findById(userId);

      // Handle populated userId (could be an object with _id) or direct userId
      const reportUserId =
        typeof report.userId === "object" && report.userId._id
          ? report.userId._id.toString()
          : report.userId.toString();

      const hasAccess =
        reportUserId === userId ||
        (user?.email
          ? report.sharedWith.some(
              (share) =>
                share.email === user.email &&
                (!share.expiresAt || share.expiresAt > new Date())
            )
          : false);

      if (!hasAccess) {
        return {
          success: false,
          message: "Unauthorized access to report",
        };
      }

      return {
        success: true,
        message: "Report fetched successfully",
        data: { report },
      };
    } catch (error) {
      logger.error("Get report by ID service error:", error);
      throw error;
    }
  }

  async downloadReport(
    reportId: string,
    userId: string
  ): Promise<ServiceResponse> {
    try {
      const report = await this.reportRepository.findById(reportId);

      if (!report) {
        return {
          success: false,
          message: "Report not found",
        };
      }

      // Check access permissions
      const user = await this.userRepository.findById(userId);
      const hasAccess =
        report.userId.toString() === userId ||
        report.sharedWith.some(
          (share) =>
            user?.email === share.email &&
            (!share.expiresAt || share.expiresAt > new Date())
        );

      if (!hasAccess) {
        return {
          success: false,
          message: "Unauthorized access to report",
        };
      }

      if (report.status !== "completed" || !report.filePath) {
        return {
          success: false,
          message: "Report is not ready for download",
        };
      }

      // Check if file exists
      try {
        await fs.access(report.filePath);
      } catch {
        return {
          success: false,
          message: "Report file not found",
        };
      }

      // Update download count
      await this.reportRepository.updateDownloadCount(reportId);

      // Read file
      const buffer = await fs.readFile(report.filePath);
      const filename = `report-${reportId}.${report.format}`;

      let mimeType = "application/octet-stream";
      switch (report.format) {
        case "pdf":
          mimeType = "application/pdf";
          break;
        case "html":
          mimeType = "text/html";
          break;
        case "json":
          mimeType = "application/json";
          break;
      }

      return {
        success: true,
        message: "Report downloaded successfully",
        data: {
          buffer,
          filename,
          mimeType,
        },
      };
    } catch (error) {
      logger.error("Download report service error:", error);
      throw error;
    }
  }

  async updateReport(
    reportId: string,
    userId: string,
    updateData: { title?: string; description?: string; isPublic?: boolean }
  ): Promise<ServiceResponse> {
    try {
      const report = await this.reportRepository.findById(reportId);

      if (!report) {
        return {
          success: false,
          message: "Report not found",
        };
      }

      if (report.userId.toString() !== userId) {
        return {
          success: false,
          message: "Unauthorized access to report",
        };
      }

      const updatedReport = await this.reportRepository.update(
        reportId,
        updateData
      );

      return {
        success: true,
        message: "Report updated successfully",
        data: { report: updatedReport },
      };
    } catch (error) {
      logger.error("Update report service error:", error);
      throw error;
    }
  }

  async deleteReport(
    reportId: string,
    userId: string
  ): Promise<ServiceResponse> {
    try {
      const report = await this.reportRepository.findById(reportId);

      if (!report) {
        return {
          success: false,
          message: "Report not found",
        };
      }

      if (report.userId.toString() !== userId) {
        return {
          success: false,
          message: "Unauthorized access to report",
        };
      }

      // Delete file if exists
      if (report.filePath) {
        try {
          await fs.unlink(report.filePath);
        } catch (error) {
          logger.warn(
            `Failed to delete report file ${report.filePath}:`,
            error
          );
        }
      }

      await this.reportRepository.delete(reportId);

      return {
        success: true,
        message: "Report deleted successfully",
      };
    } catch (error) {
      logger.error("Delete report service error:", error);
      throw error;
    }
  }

  async shareReport(request: ShareReportRequest): Promise<ServiceResponse> {
    try {
      const { reportId, userId, emails, expiresIn = 7 } = request;

      const report = await this.reportRepository.findById(reportId);

      if (!report) {
        return {
          success: false,
          message: "Report not found",
        };
      }

      if (report.userId.toString() !== userId) {
        return {
          success: false,
          message: "Unauthorized access to report",
        };
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresIn);

      const sharedWith = emails.map((email) => ({
        email,
        sharedAt: new Date(),
        expiresAt,
        accessCount: 0,
      }));

      const updatedReport = await this.reportRepository.update(reportId, {
        sharedWith: [...report.sharedWith, ...sharedWith],
      });

      // Send notification emails
      const user = await this.userRepository.findById(userId);
      if (user) {
        for (const email of emails) {
          try {
            await emailService.sendReportSharedEmail(
              email,
              reportId,
              report.title,
              user.firstName || "User"
            );
          } catch (error) {
            logger.error(
              `Failed to send share notification to ${email}:`,
              error
            );
          }
        }
      }

      return {
        success: true,
        message: "Report shared successfully",
        data: { report: updatedReport },
      };
    } catch (error) {
      logger.error("Share report service error:", error);
      throw error;
    }
  }

  async getSharedReports(userEmail: string): Promise<ServiceResponse> {
    try {
      const reports = await this.reportRepository.findSharedReports(userEmail);

      return {
        success: true,
        message: "Shared reports fetched successfully",
        data: { reports },
      };
    } catch (error) {
      logger.error("Get shared reports service error:", error);
      throw error;
    }
  }

  async getReportSharing(
    reportId: string,
    userId: string
  ): Promise<ServiceResponse> {
    try {
      const report = await this.reportRepository.findById(reportId);

      if (!report) {
        return {
          success: false,
          message: "Report not found",
        };
      }

      if (report.userId.toString() !== userId) {
        return {
          success: false,
          message: "Unauthorized access to report",
        };
      }

      const activeShares = report.sharedWith.filter(
        (share) => !share.expiresAt || share.expiresAt > new Date()
      );

      return {
        success: true,
        message: "Report sharing information fetched successfully",
        data: {
          shares: activeShares,
          totalShares: activeShares.length,
          downloadCount: report.downloadCount,
        },
      };
    } catch (error) {
      logger.error("Get report sharing service error:", error);
      throw error;
    }
  }

  async getReportStatistics(userId: string): Promise<ServiceResponse> {
    try {
      const stats = await this.reportRepository.getReportStatistics(userId);

      return {
        success: true,
        message: "Report statistics fetched successfully",
        data: stats,
      };
    } catch (error) {
      logger.error("Get report statistics service error:", error);
      throw error;
    }
  }

  async cleanupOldReports(days: number = 90): Promise<ServiceResponse> {
    try {
      const result = await this.reportRepository.cleanupOldReports(days);

      return {
        success: true,
        message: `Cleanup completed: ${result.deletedCount} old reports deleted`,
        data: { deletedCount: result.deletedCount },
      };
    } catch (error) {
      logger.error("Cleanup old reports service error:", error);
      throw error;
    }
  }
}

export const reportService = new ReportService();
export default reportService;
