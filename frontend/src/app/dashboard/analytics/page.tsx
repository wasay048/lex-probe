"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import { searchAPI, reportAPI, projectAPI } from "@/lib/api";
import toast from "react-hot-toast";
import {
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  ArrowPathIcon,
  EyeIcon,
  BuildingOfficeIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";

interface AnalyticsData {
  overview: {
    totalSearches: number;
    totalProjects: number;
    totalReports: number;
    completedAnalyses: number;
    averageRiskScore: number;
    highRiskAnalyses: number;
  };
  searchStats: {
    byStatus: {
      pending: number;
      processing: number;
      completed: number;
      failed: number;
    };
    byTimeRange: Array<{
      date: string;
      count: number;
      avgRiskScore: number;
    }>;
  };
  riskDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  topCompanies: Array<{
    name: string;
    analysisCount: number;
    avgRiskScore: number;
    lastAnalyzed: string;
  }>;
  topIndustries: Array<{
    name: string;
    analysisCount: number;
    avgRiskScore: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: "search" | "project" | "report";
    title: string;
    status: string;
    createdAt: string;
    riskScore?: number;
  }>;
}

const AnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">(
    "30d"
  );

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // In a real implementation, you would have dedicated analytics endpoints
      // For now, we'll simulate by fetching data from existing endpoints
      const [searchesRes, projectsRes, reportsRes] = await Promise.all([
        searchAPI.getUserSearches({ limit: 100 }),
        projectAPI.getUserProjects({ limit: 100 }),
        reportAPI.getUserReports({ limit: 100 }),
      ]);

      const searches = searchesRes.data.data.searches;
      const projects = projectsRes.data.data.projects;
      const reports = reportsRes.data.data.reports;

      // Process analytics data
      const completedSearches = searches.filter(
        (s: any) => s.status === "completed"
      );
      const searchesWithResults = completedSearches.filter(
        (s: any) => s.results
      );

      const totalRiskScore = searchesWithResults.reduce(
        (sum: number, s: any) => sum + (s.results?.riskScore || 0),
        0
      );
      const averageRiskScore =
        searchesWithResults.length > 0
          ? totalRiskScore / searchesWithResults.length
          : 0;

      const highRiskAnalyses = searchesWithResults.filter(
        (s: any) => s.results?.riskScore >= 0.7
      ).length;

      // Generate mock analytics data structure
      const mockAnalytics: AnalyticsData = {
        overview: {
          totalSearches: searches.length,
          totalProjects: projects.length,
          totalReports: reports.length,
          completedAnalyses: completedSearches.length,
          averageRiskScore,
          highRiskAnalyses,
        },
        searchStats: {
          byStatus: {
            pending: searches.filter((s: any) => s.status === "pending").length,
            processing: searches.filter((s: any) => s.status === "processing")
              .length,
            completed: searches.filter((s: any) => s.status === "completed")
              .length,
            failed: searches.filter((s: any) => s.status === "failed").length,
          },
          byTimeRange: generateTimeSeriesData(searches, timeRange),
        },
        riskDistribution: generateRiskDistribution(searchesWithResults),
        topCompanies: generateTopCompanies(searches),
        topIndustries: generateTopIndustries(searches),
        recentActivity: generateRecentActivity(searches, projects, reports),
      };

      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error("Failed to load analytics:", error);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadAnalytics();
      toast.success("Analytics data refreshed");
    } catch (error) {
      toast.error("Failed to refresh analytics data");
    } finally {
      setRefreshing(false);
    }
  };

  const generateTimeSeriesData = (searches: any[], range: string) => {
    // Mock time series data generation
    const days =
      range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 365;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const daySearches = searches.filter((s: any) => {
        const searchDate = new Date(s.createdAt);
        return searchDate.toDateString() === date.toDateString();
      });

      const avgRisk =
        daySearches.length > 0
          ? daySearches.reduce(
              (sum: number, s: any) => sum + (s.results?.riskScore || 0),
              0
            ) / daySearches.length
          : 0;

      data.push({
        date: date.toISOString().split("T")[0],
        count: daySearches.length,
        avgRiskScore: avgRisk,
      });
    }

    return data;
  };

  const generateRiskDistribution = (searches: any[]) => {
    const ranges = [
      { range: "Low (0-40%)", min: 0, max: 0.4 },
      { range: "Medium (40-70%)", min: 0.4, max: 0.7 },
      { range: "High (70-100%)", min: 0.7, max: 1 },
    ];

    return ranges.map((r) => {
      const count = searches.filter(
        (s: any) =>
          s.results?.riskScore >= r.min && s.results?.riskScore < r.max
      ).length;

      return {
        range: r.range,
        count,
        percentage: searches.length > 0 ? (count / searches.length) * 100 : 0,
      };
    });
  };

  const generateTopCompanies = (searches: any[]) => {
    const companyMap = new Map();

    searches.forEach((search: any) => {
      search.companyNames?.forEach((company: string) => {
        if (!companyMap.has(company)) {
          companyMap.set(company, {
            name: company,
            analysisCount: 0,
            totalRiskScore: 0,
            lastAnalyzed: search.createdAt,
          });
        }

        const data = companyMap.get(company);
        data.analysisCount++;
        data.totalRiskScore += search.results?.riskScore || 0;
        if (new Date(search.createdAt) > new Date(data.lastAnalyzed)) {
          data.lastAnalyzed = search.createdAt;
        }
      });
    });

    return Array.from(companyMap.values())
      .map((company: any) => ({
        ...company,
        avgRiskScore:
          company.analysisCount > 0
            ? company.totalRiskScore / company.analysisCount
            : 0,
      }))
      .sort((a, b) => b.analysisCount - a.analysisCount)
      .slice(0, 10);
  };

  const generateTopIndustries = (searches: any[]) => {
    const industryMap = new Map();

    searches.forEach((search: any) => {
      search.industries?.forEach((industry: string) => {
        if (!industryMap.has(industry)) {
          industryMap.set(industry, {
            name: industry,
            analysisCount: 0,
            totalRiskScore: 0,
          });
        }

        const data = industryMap.get(industry);
        data.analysisCount++;
        data.totalRiskScore += search.results?.riskScore || 0;
      });
    });

    return Array.from(industryMap.values())
      .map((industry: any) => ({
        ...industry,
        avgRiskScore:
          industry.analysisCount > 0
            ? industry.totalRiskScore / industry.analysisCount
            : 0,
      }))
      .sort((a, b) => b.analysisCount - a.analysisCount)
      .slice(0, 10);
  };

  const generateRecentActivity = (
    searches: any[],
    projects: any[],
    reports: any[]
  ) => {
    const activities = [
      ...searches.slice(0, 5).map((s: any) => ({
        id: s._id,
        type: "search" as const,
        title: s.searchName || `Analysis of ${s.companyNames?.join(", ")}`,
        status: s.status,
        createdAt: s.createdAt,
        riskScore: s.results?.riskScore,
      })),
      ...projects.slice(0, 3).map((p: any) => ({
        id: p._id,
        type: "project" as const,
        title: p.name,
        status: "active",
        createdAt: p.createdAt,
      })),
      ...reports.slice(0, 3).map((r: any) => ({
        id: r._id,
        type: "report" as const,
        title: r.title,
        status: r.status,
        createdAt: r.createdAt,
      })),
    ];

    return activities
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 10);
  };

  const getRiskColor = (score: number) => {
    if (score >= 0.7) return "text-red-600";
    if (score >= 0.4) return "text-yellow-600";
    return "text-green-600";
  };

  const getStatusIcon = (type: string, status: string) => {
    if (type === "search") {
      switch (status) {
        case "completed":
          return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
        case "processing":
          return <ClockIcon className="h-5 w-5 text-yellow-500" />;
        case "failed":
          return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
        default:
          return <ClockIcon className="h-5 w-5 text-blue-500" />;
      }
    }

    if (type === "project")
      return <FolderIcon className="h-5 w-5 text-green-500" />;
    if (type === "report")
      return <DocumentTextIcon className="h-5 w-5 text-purple-500" />;

    return <MagnifyingGlassIcon className="h-5 w-5 text-gray-500" />;
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

  if (!analytics) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Unable to load analytics
          </h3>
          <p className="text-gray-600 mb-6">
            There was an error loading your analytics data.
          </p>
          <Button onClick={loadAnalytics}>Try Again</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Analytics Dashboard
            </h1>
            <p className="mt-2 text-gray-600">
              Comprehensive insights into your cartel detection analyses and
              risk assessments.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <select
              aria-label="Select time range"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>

            <Button
              variant="outline"
              onClick={handleRefresh}
              loading={refreshing}
              leftIcon={<ArrowPathIcon className="h-4 w-4" />}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Searches
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.overview.totalSearches}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <MagnifyingGlassIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Projects</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.overview.totalProjects}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FolderIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Reports</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.overview.totalReports}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <DocumentTextIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.overview.completedAnalyses}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Avg Risk Score
                </p>
                <p
                  className={`text-2xl font-bold ${getRiskColor(analytics.overview.averageRiskScore)}`}
                >
                  {Math.round(analytics.overview.averageRiskScore * 100)}%
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Risk</p>
                <p className="text-2xl font-bold text-red-600">
                  {analytics.overview.highRiskAnalyses}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Search Status Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Search Status Distribution
            </h3>
            <div className="space-y-4">
              {Object.entries(analytics.searchStats.byStatus).map(
                ([status, count]) => (
                  <div
                    key={status}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      {getStatusIcon("search", status)}
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            status === "completed"
                              ? "bg-green-500"
                              : status === "processing"
                                ? "bg-yellow-500"
                                : status === "failed"
                                  ? "bg-red-500"
                                  : "bg-blue-500"
                          }`}
                          style={{
                            width: `${analytics.overview.totalSearches > 0 ? (count / analytics.overview.totalSearches) * 100 : 0}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-gray-900 w-8 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Risk Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Risk Score Distribution
            </h3>
            <div className="space-y-4">
              {analytics.riskDistribution.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {item.range}
                  </span>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          item.range.startsWith("High")
                            ? "bg-red-500"
                            : item.range.startsWith("Medium")
                              ? "bg-yellow-500"
                              : "bg-green-500"
                        }`}
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold text-gray-900 w-8 text-right">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Companies */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Most Analyzed Companies
            </h3>
            <div className="space-y-3">
              {analytics.topCompanies.slice(0, 5).map((company, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded">
                      <BuildingOfficeIcon className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {company.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {company.analysisCount} analyses
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-bold ${getRiskColor(company.avgRiskScore)}`}
                    >
                      {Math.round(company.avgRiskScore * 100)}%
                    </p>
                    <p className="text-xs text-gray-500">avg risk</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Industries */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Top Industries
            </h3>
            <div className="space-y-3">
              {analytics.topIndustries.slice(0, 5).map((industry, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded">
                      <GlobeAltIcon className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {industry.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {industry.analysisCount} analyses
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-bold ${getRiskColor(industry.avgRiskScore)}`}
                    >
                      {Math.round(industry.avgRiskScore * 100)}%
                    </p>
                    <p className="text-xs text-gray-500">avg risk</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div className="space-y-4">
            {analytics.recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  {getStatusIcon(activity.type, activity.status)}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {activity.title}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="capitalize">{activity.type}</span>
                      <span>•</span>
                      <span className="capitalize">{activity.status}</span>
                      <span>•</span>
                      <span>
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {activity.riskScore !== undefined && (
                    <div className="text-right">
                      <p
                        className={`text-sm font-bold ${getRiskColor(activity.riskScore)}`}
                      >
                        {Math.round(activity.riskScore * 100)}%
                      </p>
                      <p className="text-xs text-gray-500">risk</p>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<EyeIcon className="h-4 w-4" />}
                    onClick={() => {
                      const baseUrl = `/dashboard/${activity.type === "search" ? "search" : activity.type === "project" ? "projects" : "reports"}`;
                      window.location.href = `${baseUrl}/${activity.id}`;
                    }}
                  >
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;
