"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import { searchAPI, reportAPI, projectAPI } from "@/lib/api";
import toast from "react-hot-toast";
import {
  MagnifyingGlassIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  TagIcon,
  BuildingOfficeIcon,
  GlobeAltIcon,
  ChartBarIcon,
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

interface SearchResult {
  _id: string;
  searchName?: string;
  companies: Array<{
    name: string;
    website: string;
    industry?: string;
    region?: string;
  }>;
  companyNames: string[]; // For backward compatibility
  industries?: string[];
  regions?: string[];
  timePeriod: string;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: string;
  updatedAt: string;
  description?: string;
  overallRiskScore?: number;
  executionTime?: number;
  filters?: {
    dateRange: {
      from: string;
      to: string;
    };
    searchType: string;
  };
  selectedIndicators?: Array<{
    category: string;
    indicator: string;
    riskScore: number;
    isSelected: boolean;
  }>;
  searchMode?: string;
  results?: Array<{
    indicator: string;
    category: string;
    riskScore: number;
    confidence: number;
    evidence: Array<{
      source: string;
      url: string;
      content: string;
      timestamp: string;
      relevanceScore: number;
    }>;
    summary: string;
  }>;
}

const SearchDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const [search, setSearch] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveToProjectLoading, setSaveToProjectLoading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [saveProjectData, setSaveProjectData] = useState({
    selectedProject: "",
    createNew: false,
    newProjectName: "",
    newProjectDescription: "",
    newProjectTags: [] as string[],
  });

  const searchId = params.id as string;

  console.log("SearchDetailPage - params:", params);
  console.log("SearchDetailPage - searchId:", searchId);
  console.log("SearchDetailPage - typeof searchId:", typeof searchId);

  useEffect(() => {
    console.log("useEffect triggered with searchId:", searchId);
    if (searchId && searchId !== "undefined") {
      loadSearch();
    } else {
      console.error("Invalid searchId received:", searchId);
      toast.error("Invalid search ID");
      router.push("/dashboard/search");
    }
  }, [searchId]);

  const loadSearch = async () => {
    try {
      setLoading(true);
      console.log("Loading search with ID:", searchId);
      const response = await searchAPI.getSearchById(searchId);
      console.log("Search API response:", response.data); // Debug log

      if (response.data.success && response.data.data) {
        setSearch(response.data.data.search || response.data.data);
      } else {
        throw new Error(response.data.message || "Failed to load search");
      }
    } catch (error) {
      console.error("Failed to load search:", error);
      toast.error("Failed to load search");
      router.push("/dashboard/search");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get company names
  const getCompanyNames = (search: SearchResult): string[] => {
    if (search.companyNames && search.companyNames.length > 0) {
      return search.companyNames;
    }
    if (search.companies && search.companies.length > 0) {
      return search.companies.map((company) => company.name);
    }
    return [];
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadSearch();
      toast.success("Search data refreshed");
    } catch (error) {
      toast.error("Failed to refresh search data");
    } finally {
      setRefreshing(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!search || search.status !== "completed") return;

    try {
      setGenerating(true);
      const response = await reportAPI.generateReport({
        searchId: search._id,
        title: `Cartel Analysis Report - ${getCompanyNames(search).join(" vs ")}`,
        sections: [
          "executive_summary",
          "methodology",
          "findings",
          "recommendations",
        ],
        format: "pdf",
      });

      const reportId = response.data.data.report._id;
      toast.success("Report generation started");
      router.push(`/reports/${reportId}`);
    } catch (error) {
      console.error("Failed to generate report:", error);
      toast.error("Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveToProject = async () => {
    if (!search) return;

    try {
      setShowSaveDialog(true);
      const response = await projectAPI.getUserProjects({ limit: 100 });
      if (response.data.success) {
        setProjects(response.data.data?.projects || []);
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
      toast.error("Failed to load projects");
    }
  };

  const handleChangeProject = async () => {
    if (!search) return;

    try {
      setShowSaveDialog(true);
      const response = await projectAPI.getUserProjects({ limit: 100 });
      if (response.data.success) {
        setProjects(response.data.data?.projects || []);
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
      toast.error("Failed to load projects");
    }
  };

  const handleSaveToProjectSubmit = async () => {
    if (!search) return;

    try {
      setSaveToProjectLoading(true);

      let projectId = saveProjectData.selectedProject;

      // Create new project if requested
      if (saveProjectData.createNew) {
        if (!saveProjectData.newProjectName.trim()) {
          toast.error("Project name is required");
          return;
        }

        const createResponse = await projectAPI.createProject({
          name: saveProjectData.newProjectName,
          description: saveProjectData.newProjectDescription || undefined,
          tags:
            saveProjectData.newProjectTags.length > 0
              ? saveProjectData.newProjectTags
              : undefined,
        });

        if (!createResponse.data.success) {
          throw new Error("Failed to create project");
        }

        projectId = createResponse.data.data._id;
      }

      if (!projectId) {
        toast.error("Please select a project or create a new one");
        return;
      }

      // Add search to project
      await projectAPI.addSearchToProject(projectId, search._id);
      toast.success("Search saved to project successfully");
      setShowSaveDialog(false);

      // Reset form
      setSaveProjectData({
        selectedProject: "",
        createNew: false,
        newProjectName: "",
        newProjectDescription: "",
        newProjectTags: [],
      });
    } catch (error: any) {
      console.error("Failed to save search to project:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to save search to project";
      toast.error(errorMessage);
    } finally {
      setSaveToProjectLoading(false);
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

  const getRiskColor = (score: number) => {
    if (score >= 0.7) return "text-red-600 bg-red-100";
    if (score >= 0.4) return "text-yellow-600 bg-yellow-100";
    return "text-green-600 bg-green-100";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
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
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!search) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Search not found
          </h3>
          <p className="text-gray-600 mb-6">
            The search you're looking for doesn't exist or has been deleted.
          </p>
          <Button onClick={() => router.push("/dashboard/search")}>
            Back to Searches
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              leftIcon={<ArrowLeftIcon className="h-4 w-4" />}
            >
              Back
            </Button>
            <div>
              <div className="flex items-center space-x-3 mb-2">
                {getStatusIcon(search.status)}
                <h1 className="text-3xl font-bold text-gray-900">
                  {search.searchName ||
                    `Analysis of ${getCompanyNames(search).join(", ")}`}
                </h1>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(search.status)}`}
                >
                  {search.status}
                </span>
              </div>
              {search.description && (
                <p className="text-gray-600">{search.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              loading={refreshing}
              leftIcon={<ArrowPathIcon className="h-4 w-4" />}
            >
              Refresh
            </Button>

            {search.status === "completed" && (
              <>
                {search.projectId ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Project:</span>
                    <span className="font-medium text-gray-800">
                      {search.project?.name || search.projectName || "Assigned"}
                    </span>
                    <Button
                      onClick={() => setShowSaveDialog(true)}
                      variant="outline"
                      leftIcon={<PlusIcon className="h-4 w-4" />}
                      className="border-green-300 text-green-700 hover:bg-green-50"
                    >
                      Change Project
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => setShowSaveDialog(true)}
                    variant="outline"
                    leftIcon={<PlusIcon className="h-4 w-4" />}
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    Save as Project
                  </Button>
                )}

                <Button
                  onClick={handleGenerateReport}
                  loading={generating}
                  leftIcon={<DocumentTextIcon className="h-4 w-4" />}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Generate Report
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Search Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Search Parameters
              </h2>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Companies
                    </p>
                    <p className="text-sm text-gray-600">
                      {getCompanyNames(search).join(", ")}
                    </p>
                  </div>
                </div>

                {search.industries && search.industries.length > 0 && (
                  <div className="flex items-center space-x-3">
                    <TagIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Industries
                      </p>
                      <p className="text-sm text-gray-600">
                        {search.industries.join(", ")}
                      </p>
                    </div>
                  </div>
                )}

                {search.regions && search.regions.length > 0 && (
                  <div className="flex items-center space-x-3">
                    <GlobeAltIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Regions
                      </p>
                      <p className="text-sm text-gray-600">
                        {search.regions.join(", ")}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Time Period
                    </p>
                    <p className="text-sm text-gray-600">
                      {search.filters?.dateRange
                        ? `${new Date(search.filters.dateRange.from).toLocaleDateString()} - ${new Date(search.filters.dateRange.to).toLocaleDateString()}`
                        : search.timePeriod || "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Created</p>
                    <p className="text-sm text-gray-600">
                      {new Date(search.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Last Updated
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(search.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {search.selectedIndicators &&
                  search.selectedIndicators.length > 0 && (
                    <div className="border-t pt-4 mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Analyzed Indicators ({search.selectedIndicators.length})
                      </p>
                      <div className="space-y-2">
                        {search.selectedIndicators.map((indicator, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-gray-600">
                              {indicator.indicator}
                            </span>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">
                                {indicator.category}
                              </span>
                              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                                Risk: {indicator.riskScore}/5
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Status
              </h3>
              <div className="flex items-center space-x-3">
                {getStatusIcon(search.status)}
                <div>
                  <p className="text-sm font-medium text-gray-900 capitalize">
                    {search.status}
                  </p>
                  <p className="text-xs text-gray-500">
                    {search.status === "completed" && "Analysis complete"}
                    {search.status === "processing" && "Analyzing data..."}
                    {search.status === "pending" && "Waiting to be processed"}
                    {search.status === "failed" && "Analysis failed"}
                  </p>
                </div>
              </div>
            </div>

            {/* Risk Score */}
            {search.results && search.results.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Risk Assessment
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Overall Risk Score
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor((search.overallRiskScore || 0) / 5)}`}
                      >
                        {search.overallRiskScore?.toFixed(1) || "0.0"}/5
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${(search.overallRiskScore || 0) / 5 >= 0.7 ? "bg-red-500" : (search.overallRiskScore || 0) / 5 >= 0.4 ? "bg-yellow-500" : "bg-green-500"}`}
                        style={{
                          width: `${((search.overallRiskScore || 0) / 5) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Indicators Found
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {search.results.length} indicators
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {search.executionTime &&
                        `Analysis completed in ${search.executionTime / 1000}s`}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Analysis Results */}
        {search.status === "completed" && search.results ? (
          <div className="space-y-6">
            {/* Key Findings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Key Findings
              </h2>
              <div className="space-y-4">
                {search.results && search.results.length > 0 ? (
                  search.results.map((result, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900">
                          {result.indicator}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              result.riskScore >= 4
                                ? getSeverityColor("high")
                                : result.riskScore >= 3
                                  ? getSeverityColor("medium")
                                  : getSeverityColor("low")
                            }`}
                          >
                            Risk: {result.riskScore}/5
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {Math.round(result.confidence * 100)}% confidence
                          </span>
                        </div>
                      </div>
                      <div className="mb-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {result.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {result.summary}
                      </p>
                      {result.evidence && result.evidence.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-700 mb-2">
                            Evidence ({result.evidence.length} sources):
                          </p>
                          <div className="space-y-2">
                            {result.evidence.map((evidence, evidenceIndex) => (
                              <div
                                key={evidenceIndex}
                                className="bg-gray-50 rounded p-2 text-xs"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium text-gray-700">
                                    {evidence.source}
                                  </span>
                                  <span className="text-gray-500">
                                    {Math.round(evidence.relevanceScore * 100)}%
                                    relevant
                                  </span>
                                </div>
                                <p className="text-gray-600 mb-1">
                                  {evidence.content}
                                </p>
                                {evidence.url && (
                                  <a
                                    href={evidence.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 underline"
                                  >
                                    View Source
                                  </a>
                                )}
                                <div className="text-gray-400 text-xs mt-1">
                                  {new Date(
                                    evidence.timestamp
                                  ).toLocaleString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No findings available yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Market Analysis */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Market Analysis
              </h2>
              {search.analysisResults?.marketAnalysis ? (
                <div className="space-y-6">
                  {/* Market Overview */}
                  {search.analysisResults.marketAnalysis.overview && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="text-md font-medium text-blue-900 mb-2">
                        Market Overview
                      </h3>
                      <p className="text-sm text-blue-800">
                        {search.analysisResults.marketAnalysis.overview}
                      </p>
                    </div>
                  )}

                  {/* Competitive Landscape */}
                  {search.analysisResults.marketAnalysis
                    .competitiveLandscape && (
                    <div>
                      <h3 className="text-md font-medium text-gray-900 mb-3">
                        Competitive Landscape
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {search.analysisResults.marketAnalysis.competitiveLandscape.map(
                          (analysis: any, index: number) => (
                            <div
                              key={index}
                              className="border border-gray-200 rounded-lg p-4"
                            >
                              <h4 className="font-medium text-gray-900 mb-2">
                                {analysis.company}
                              </h4>
                              <div className="space-y-2 text-sm">
                                {analysis.marketShare && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      Market Share:
                                    </span>
                                    <span className="font-medium text-gray-900">
                                      {analysis.marketShare}%
                                    </span>
                                  </div>
                                )}
                                {analysis.position && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      Position:
                                    </span>
                                    <span className="font-medium text-gray-900">
                                      {analysis.position}
                                    </span>
                                  </div>
                                )}
                                {analysis.strengths && (
                                  <div>
                                    <span className="text-gray-600">
                                      Strengths:
                                    </span>
                                    <p className="text-gray-800 mt-1">
                                      {analysis.strengths}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* Pricing Analysis Table */}
                  {search.analysisResults.marketAnalysis.pricingData && (
                    <div>
                      <h3 className="text-md font-medium text-gray-900 mb-3">
                        Pricing Analysis
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Company
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Product/Service
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Price Range
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Source
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Last Updated
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {search.analysisResults.marketAnalysis.pricingData.map(
                              (pricing: any, index: number) => (
                                <tr key={index}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {pricing.company}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {pricing.product}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {pricing.price}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <a
                                      href={pricing.source}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 underline"
                                    >
                                      View Source
                                    </a>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {pricing.date}
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Market Indicators */}
                  {search.analysisResults.marketAnalysis.indicators && (
                    <div>
                      <h3 className="text-md font-medium text-gray-900 mb-3">
                        Market Indicators
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Object.entries(
                          search.analysisResults.marketAnalysis.indicators
                        ).map(([key, value]: [string, any], index) => (
                          <div
                            key={index}
                            className="bg-gray-50 rounded-lg p-4 text-center"
                          >
                            <div className="text-2xl font-bold text-gray-900 mb-1">
                              {value.value}
                            </div>
                            <div className="text-sm text-gray-600 capitalize">
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </div>
                            {value.trend && (
                              <div
                                className={`text-xs mt-1 ${
                                  value.trend === "up"
                                    ? "text-green-600"
                                    : value.trend === "down"
                                      ? "text-red-600"
                                      : "text-gray-600"
                                }`}
                              >
                                {value.trend === "up"
                                  ? "↗"
                                  : value.trend === "down"
                                    ? "↘"
                                    : "→"}{" "}
                                {value.change}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Market analysis not available yet.
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Enhanced analysis with OSINT data will be available after
                    completion.
                  </p>
                </div>
              )}
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Recommendations
              </h2>
              {search.analysisResults?.recommendations &&
              search.analysisResults.recommendations.length > 0 ? (
                <div className="space-y-4">
                  {search.analysisResults.recommendations.map(
                    (rec: any, index: number) => (
                      <div
                        key={index}
                        className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded-r-lg"
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-purple-500 text-white text-sm font-medium">
                              {index + 1}
                            </div>
                          </div>
                          <div className="ml-4 flex-1">
                            {typeof rec === "string" ? (
                              <p className="text-sm text-gray-800">{rec}</p>
                            ) : (
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-2">
                                  {rec.title ||
                                    rec.category ||
                                    `Recommendation ${index + 1}`}
                                </h4>
                                <p className="text-sm text-gray-700 mb-2">
                                  {rec.description ||
                                    rec.recommendation ||
                                    rec.content}
                                </p>
                                {rec.priority && (
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      rec.priority === "high"
                                        ? "bg-red-100 text-red-800"
                                        : rec.priority === "medium"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-green-100 text-green-800"
                                    }`}
                                  >
                                    {rec.priority} priority
                                  </span>
                                )}
                                {rec.timeline && (
                                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {rec.timeline}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  )}

                  {/* Key Actions Summary */}
                  {search.analysisResults?.keyActions && (
                    <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                      <h3 className="text-md font-medium text-gray-900 mb-3">
                        Key Actions Summary
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {search.analysisResults.keyActions.map(
                          (action: any, index: number) => (
                            <div
                              key={index}
                              className="bg-white rounded-lg p-3 border border-gray-200"
                            >
                              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                                {action.category || "Action"}
                              </div>
                              <div className="text-sm font-medium text-gray-900">
                                {action.action || action.title || action}
                              </div>
                              {action.urgency && (
                                <div
                                  className={`text-xs mt-1 ${
                                    action.urgency === "immediate"
                                      ? "text-red-600"
                                      : action.urgency === "short-term"
                                        ? "text-orange-600"
                                        : "text-blue-600"
                                  }`}
                                >
                                  {action.urgency} action required
                                </div>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    No recommendations available yet.
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    AI-powered recommendations will be generated based on the
                    comprehensive analysis results.
                  </p>
                </div>
              )}
            </div>

            {/* Open Source Intelligence */}
            {search.analysisResults?.openSourceFindings && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Open Source Intelligence
                </h2>
                <div className="space-y-6">
                  {/* Web Search Results */}
                  {search.analysisResults.openSourceFindings.webResults &&
                    search.analysisResults.openSourceFindings.webResults
                      .length > 0 && (
                      <div>
                        <h3 className="text-md font-medium text-gray-900 mb-3">
                          Web Search Findings
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {search.analysisResults.openSourceFindings.webResults
                            .slice(0, 6)
                            .map((result: any, index: number) => (
                              <div
                                key={index}
                                className="border border-gray-200 rounded-lg p-4"
                              >
                                <h4 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
                                  {result.title}
                                </h4>
                                <p className="text-xs text-gray-600 mb-2 line-clamp-3">
                                  {result.snippet || result.description}
                                </p>
                                <div className="flex items-center justify-between">
                                  <a
                                    href={result.link || result.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                                  >
                                    View Source
                                  </a>
                                  {result.relevanceScore && (
                                    <span className="text-xs text-gray-500">
                                      {Math.round(result.relevanceScore * 100)}%
                                      relevant
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                  {/* News Articles */}
                  {search.analysisResults.openSourceFindings.newsArticles &&
                    search.analysisResults.openSourceFindings.newsArticles
                      .length > 0 && (
                      <div>
                        <h3 className="text-md font-medium text-gray-900 mb-3">
                          Recent News & Media Coverage
                        </h3>
                        <div className="space-y-3">
                          {search.analysisResults.openSourceFindings.newsArticles
                            .slice(0, 5)
                            .map((article: any, index: number) => (
                              <div
                                key={index}
                                className="border border-gray-200 rounded-lg p-4"
                              >
                                <div className="flex items-start space-x-3">
                                  <div className="flex-shrink-0">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                                      {article.title}
                                    </h4>
                                    <p className="text-xs text-gray-600 mb-2">
                                      {article.snippet || article.description}
                                    </p>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-3">
                                        <span className="text-xs text-gray-500">
                                          {article.source ||
                                            article.displayLink}
                                        </span>
                                        {article.date && (
                                          <span className="text-xs text-gray-500">
                                            {new Date(
                                              article.date
                                            ).toLocaleDateString()}
                                          </span>
                                        )}
                                      </div>
                                      <a
                                        href={article.link || article.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                                      >
                                        Read Article
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                  {/* Summary Statistics */}
                  {search.analysisResults.openSourceFindings.summary && (
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
                      <h3 className="text-md font-medium text-gray-900 mb-3">
                        OSINT Summary
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">
                            {search.analysisResults.openSourceFindings.summary
                              .totalSources || 0}
                          </div>
                          <div className="text-xs text-gray-600">
                            Total Sources
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">
                            {search.analysisResults.openSourceFindings.summary
                              .highRelevance || 0}
                          </div>
                          <div className="text-xs text-gray-600">
                            High Relevance
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">
                            {search.analysisResults.openSourceFindings.summary
                              .newsArticles || 0}
                          </div>
                          <div className="text-xs text-gray-600">
                            News Articles
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">
                            {search.analysisResults.openSourceFindings.summary
                              .lastUpdated
                              ? new Date(
                                  search.analysisResults.openSourceFindings.summary.lastUpdated
                                ).toLocaleDateString()
                              : "Today"}
                          </div>
                          <div className="text-xs text-gray-600">
                            Last Updated
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {search.status === "processing" && "Analysis in progress"}
              {search.status === "pending" && "Analysis queued"}
              {search.status === "failed" && "Analysis failed"}
            </h3>
            <p className="text-gray-600">
              {search.status === "processing" &&
                "We are analyzing the data. This may take a few minutes."}
              {search.status === "pending" &&
                "Your analysis is in the queue and will be processed soon."}
              {search.status === "failed" &&
                "There was an error processing your analysis. Please try again."}
            </p>
          </div>
        )}
      </div>

      {/* Save to Project Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Save Search to Project
              </h3>

              <div className="space-y-4">
                {/* Project Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Choose Option
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="projectOption"
                        checked={!saveProjectData.createNew}
                        onChange={() =>
                          setSaveProjectData((prev) => ({
                            ...prev,
                            createNew: false,
                          }))
                        }
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Save to existing project
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="projectOption"
                        checked={saveProjectData.createNew}
                        onChange={() =>
                          setSaveProjectData((prev) => ({
                            ...prev,
                            createNew: true,
                          }))
                        }
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Create new project
                      </span>
                    </label>
                  </div>
                </div>

                {/* Existing Project Selection */}
                {!saveProjectData.createNew && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Project
                    </label>
                    <select
                      value={saveProjectData.selectedProject}
                      onChange={(e) =>
                        setSaveProjectData((prev) => ({
                          ...prev,
                          selectedProject: e.target.value,
                        }))
                      }
                      title="Select a project to save this search to"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={!saveProjectData.createNew}
                    >
                      <option value="">Select a project...</option>
                      {projects.map((project) => (
                        <option key={project._id} value={project._id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* New Project Fields */}
                {saveProjectData.createNew && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Project Name *
                      </label>
                      <input
                        type="text"
                        value={saveProjectData.newProjectName}
                        onChange={(e) =>
                          setSaveProjectData((prev) => ({
                            ...prev,
                            newProjectName: e.target.value,
                          }))
                        }
                        placeholder="Enter project name..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required={saveProjectData.createNew}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description (optional)
                      </label>
                      <textarea
                        value={saveProjectData.newProjectDescription}
                        onChange={(e) =>
                          setSaveProjectData((prev) => ({
                            ...prev,
                            newProjectDescription: e.target.value,
                          }))
                        }
                        placeholder="Describe this project..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Dialog Actions */}
              <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => setShowSaveDialog(false)}
                  disabled={saveToProjectLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveToProjectSubmit}
                  loading={saveToProjectLoading}
                  disabled={
                    saveToProjectLoading ||
                    (!saveProjectData.createNew &&
                      !saveProjectData.selectedProject) ||
                    (saveProjectData.createNew &&
                      !saveProjectData.newProjectName.trim())
                  }
                >
                  {saveToProjectLoading ? "Saving..." : "Save to Project"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default SearchDetailPage;
