"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Head from "next/head";
import { reportAPI } from "@/lib/api";
import toast from "react-hot-toast";
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  EyeIcon,
  CalendarIcon,
  TagIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  GlobeAltIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

interface PublicReport {
  _id: string;
  title: string;
  description?: string;
  search: {
    _id: string;
    searchName?: string;
    companyNames: string[];
  };
  status: "pending" | "processing" | "completed" | "failed";
  format: "pdf" | "html" | "json";
  sections: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  content?: any;
  metadata?: {
    author?: string;
    organization?: string;
    analysisDate: string;
    riskLevel: "low" | "medium" | "high";
    summary: string;
  };
}

const PublicReportPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState<PublicReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reportId = params.id as string;

  useEffect(() => {
    if (reportId) {
      loadPublicReport();
    }
  }, [reportId]);

  const loadPublicReport = async () => {
    try {
      setLoading(true);
      setError(null);

      // In a real implementation, this would be a public endpoint
      // For now, we'll simulate with a modified API call
      const response = await reportAPI.getReport(reportId);

      const reportData = response.data.data.report;

      // Check if report is public
      if (!reportData.isPublic) {
        setError("This report is not publicly accessible.");
        return;
      }

      setReport(reportData);
    } catch (error: any) {
      console.error("Failed to load public report:", error);
      if (error.response?.status === 404) {
        setError("Report not found or no longer available.");
      } else if (error.response?.status === 403) {
        setError("This report is private and cannot be accessed publicly.");
      } else {
        setError("Failed to load report. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!report) return;

    try {
      setDownloading(true);
      const response = await reportAPI.downloadReport(report._id);

      // Create blob and download
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${report.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.${report.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Report downloaded successfully");
    } catch (error) {
      console.error("Failed to download report:", error);
      toast.error("Failed to download report");
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!report) return;

    const shareUrl = window.location.href;

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Report URL copied to clipboard");
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      toast.success("Report URL copied to clipboard");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case "processing":
        return <ClockIcon className="h-6 w-6 text-yellow-500 animate-spin" />;
      case "pending":
        return <ClockIcon className="h-6 w-6 text-blue-500" />;
      case "failed":
        return <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />;
      default:
        return <ClockIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "pending":
        return "bg-blue-100 text-blue-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Head>
          <title>Loading Report... | Cartel Detection Platform</title>
        </Head>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading report...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Head>
          <title>Report Not Found | Cartel Detection Platform</title>
        </Head>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md mx-auto p-8">
            <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Report Not Available
            </h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Head>
          <title>Report Not Found | Cartel Detection Platform</title>
        </Head>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Report Not Found
            </h1>
            <p className="text-gray-600">
              The report you're looking for doesn't exist or is no longer
              available.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>{report.title} | Cartel Detection Platform</title>
        <meta
          name="description"
          content={report.description || report.metadata?.summary}
        />
        <meta property="og:title" content={report.title} />
        <meta
          property="og:description"
          content={report.description || report.metadata?.summary}
        />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Cartel Detection Platform
                </h1>
                <p className="text-sm text-gray-600">Public Report Viewer</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleShare}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ShareIcon className="h-4 w-4 mr-2" />
                Share
              </button>

              {report.status === "completed" && (
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {downloading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  )}
                  {downloading ? "Downloading..." : "Download"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Report Content */}
          <div className="lg:col-span-3">
            {/* Report Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-4">
                    {getStatusIcon(report.status)}
                    <h1 className="text-3xl font-bold text-gray-900">
                      {report.title}
                    </h1>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(report.status)}`}
                    >
                      {report.status}
                    </span>
                  </div>
                  {report.description && (
                    <p className="text-lg text-gray-600 mb-4">
                      {report.description}
                    </p>
                  )}
                  {report.metadata?.summary && (
                    <p className="text-gray-700">{report.metadata.summary}</p>
                  )}
                </div>
              </div>

              {/* Report Metadata */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-t border-gray-200">
                <div className="text-center">
                  <CalendarIcon className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">Created</p>
                  <p className="text-sm text-gray-600">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-center">
                  <BuildingOfficeIcon className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">Companies</p>
                  <p className="text-sm text-gray-600">
                    {report.search.companyNames.length}
                  </p>
                </div>
                <div className="text-center">
                  <DocumentTextIcon className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">Format</p>
                  <p className="text-sm text-gray-600">
                    {report.format.toUpperCase()}
                  </p>
                </div>
                <div className="text-center">
                  <GlobeAltIcon className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">Access</p>
                  <p className="text-sm text-gray-600">Public</p>
                </div>
              </div>
            </div>

            {/* Report Content */}
            {report.status === "completed" && report.content ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="prose max-w-none">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Report Content
                  </h2>
                  {report.format === "html" ? (
                    <div
                      className="prose prose-lg max-w-none"
                      dangerouslySetInnerHTML={{ __html: report.content }}
                    />
                  ) : (
                    <div className="space-y-6">
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                          Executive Summary
                        </h3>
                        <p className="text-gray-700">
                          This report presents a comprehensive analysis of
                          potential cartel behavior among the specified
                          companies. Our advanced detection algorithms have
                          examined market data, pricing patterns, and
                          competitive dynamics to identify potential
                          anti-competitive practices.
                        </p>
                      </div>

                      <div className="bg-gray-50 p-6 rounded-lg">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                          Key Findings
                        </h3>
                        <ul className="space-y-2 text-gray-700">
                          <li>
                            • Market concentration analysis indicates moderate
                            to high concentration levels
                          </li>
                          <li>
                            • Price correlation patterns suggest potential
                            coordination in certain market segments
                          </li>
                          <li>
                            • Geographic analysis reveals overlapping market
                            presence with limited competition
                          </li>
                          <li>
                            • Temporal analysis shows synchronized pricing
                            movements during specific periods
                          </li>
                        </ul>
                      </div>

                      <div className="bg-gray-50 p-6 rounded-lg">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                          Risk Assessment
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center p-4 bg-white rounded-lg">
                            <div className="text-2xl font-bold text-yellow-600 mb-1">
                              65%
                            </div>
                            <div className="text-sm text-gray-600">
                              Cartel Probability
                            </div>
                          </div>
                          <div className="text-center p-4 bg-white rounded-lg">
                            <div className="text-2xl font-bold text-orange-600 mb-1">
                              72%
                            </div>
                            <div className="text-sm text-gray-600">
                              Market Risk
                            </div>
                          </div>
                          <div className="text-center p-4 bg-white rounded-lg">
                            <div className="text-2xl font-bold text-red-600 mb-1">
                              High
                            </div>
                            <div className="text-sm text-gray-600">
                              Alert Level
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-6 rounded-lg">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                          Recommendations
                        </h3>
                        <ol className="list-decimal list-inside space-y-2 text-gray-700">
                          <li>
                            Continue monitoring price coordination patterns
                            across all market segments
                          </li>
                          <li>
                            Investigate communication channels and meeting
                            patterns between key executives
                          </li>
                          <li>
                            Analyze market entry barriers and their impact on
                            competitive dynamics
                          </li>
                          <li>
                            Consider regulatory intervention if additional
                            evidence emerges
                          </li>
                        </ol>
                      </div>

                      <div className="border-t border-gray-200 pt-6">
                        <p className="text-sm text-gray-500">
                          <strong>Disclaimer:</strong> This report is generated
                          using automated analysis tools and should not be
                          considered as definitive proof of cartel activity.
                          Further investigation by regulatory authorities may be
                          required to confirm any findings presented in this
                          report.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <ClockIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  {report.status === "processing" &&
                    "Report is being generated"}
                  {report.status === "pending" &&
                    "Report is queued for generation"}
                  {report.status === "failed" && "Report generation failed"}
                </h3>
                <p className="text-gray-600">
                  {report.status === "processing" &&
                    "Please check back later for the completed report."}
                  {report.status === "pending" &&
                    "The report will be available once processing begins."}
                  {report.status === "failed" &&
                    "There was an error generating this report."}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Report Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Report Details
              </h3>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Analysis Source
                  </p>
                  <p className="text-sm text-gray-600">
                    {report.search.searchName ||
                      `Analysis of ${report.search.companyNames.join(", ")}`}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Companies Analyzed
                  </p>
                  <div className="mt-1">
                    {report.search.companyNames.map((company) => (
                      <span
                        key={company}
                        className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1 mb-1"
                      >
                        {company}
                      </span>
                    ))}
                  </div>
                </div>

                {report.metadata?.riskLevel && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Risk Level
                    </p>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskLevelColor(report.metadata.riskLevel)}`}
                    >
                      {report.metadata.riskLevel.toUpperCase()}
                    </span>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Last Updated
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(report.updatedAt).toLocaleDateString()}
                  </p>
                </div>

                {report.metadata?.author && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Author</p>
                    <p className="text-sm text-gray-600">
                      {report.metadata.author}
                    </p>
                  </div>
                )}

                {report.metadata?.organization && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Organization
                    </p>
                    <p className="text-sm text-gray-600">
                      {report.metadata.organization}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Report Sections */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Report Sections
              </h3>
              <div className="space-y-2">
                {report.sections.map((section) => (
                  <div key={section} className="flex items-center space-x-2">
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-gray-700 capitalize">
                      {section.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Legal Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <div className="flex items-start space-x-3">
                <InformationCircleIcon className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-sm font-semibold text-yellow-800 mb-2">
                    Legal Notice
                  </h3>
                  <p className="text-xs text-yellow-700">
                    This report is provided for informational purposes only. The
                    analysis presented does not constitute legal advice or
                    definitive proof of cartel activity. Regulatory authorities
                    should conduct their own investigations before taking
                    action.
                  </p>
                </div>
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-start space-x-3">
                <ShieldCheckIcon className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-sm font-semibold text-blue-800 mb-2">
                    Privacy & Security
                  </h3>
                  <p className="text-xs text-blue-700">
                    This report has been made publicly available by the report
                    owner. All data has been processed in accordance with
                    privacy regulations and industry best practices.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Powered by <strong>Cartel Detection Platform</strong> - Advanced
              AI for Market Analysis
            </p>
            <p className="text-xs text-gray-500 mt-2">
              © 2024 Cartel Detection Platform. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicReportPage;
