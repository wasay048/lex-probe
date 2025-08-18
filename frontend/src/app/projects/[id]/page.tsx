"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import { projectAPI, searchAPI, reportAPI } from "@/lib/api";
import toast from "react-hot-toast";
import {
  FolderIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  EyeIcon,
  CalendarIcon,
  TagIcon,
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface Project {
  _id: string;
  name: string;
  description?: string;
  tags?: string[];
  searches: Search[];
  createdAt: string;
  updatedAt: string;
  user: string;
}

interface Search {
  _id: string;
  searchName?: string;
  companyNames: string[];
  industries?: string[];
  regions?: string[];
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: string;
  updatedAt: string;
  results?: {
    cartelProbability: number;
    riskScore: number;
  };
}

const ProjectDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  const projectId = params.id as string;

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const response = await projectAPI.getProjectById(projectId);
      setProject(response.data.data.project);
    } catch (error) {
      console.error("Failed to load project:", error);
      toast.error("Failed to load project");
      router.push("/dashboard/projects");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadProject();
      toast.success("Project data refreshed");
    } catch (error) {
      toast.error("Failed to refresh project data");
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = async () => {
    if (!project) return;

    if (
      !confirm(
        "Are you sure you want to delete this project? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setDeleting(true);
      await projectAPI.deleteProject(project._id);
      toast.success("Project deleted successfully");
      router.push("/dashboard/projects");
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast.error("Failed to delete project");
    } finally {
      setDeleting(false);
    }
  };

  const handleGenerateComprehensiveReport = async () => {
    if (!project || project.searches.length === 0) return;

    const completedSearches = project.searches.filter(
      (search) => search.status === "completed"
    );
    if (completedSearches.length === 0) {
      toast.error("No completed searches found in this project");
      return;
    }

    try {
      setGeneratingReport(true);

      // Generate a comprehensive report for the project using the first completed search
      // In a real implementation, you might want to create a specific endpoint for project reports
      const response = await reportAPI.generateReport({
        searchId: completedSearches[0]._id,
        title: `Comprehensive Project Report - ${project.name}`,
        description: `Comprehensive analysis report for project: ${project.name}`,
        sections: [
          "executive_summary",
          "methodology",
          "findings",
          "risk_assessment",
          "market_analysis",
          "recommendations",
        ],
        format: "pdf",
      });

      const reportId = response.data.data.report._id;
      toast.success("Comprehensive report generation started");
      router.push(`/reports/${reportId}`);
    } catch (error) {
      console.error("Failed to generate comprehensive report:", error);
      toast.error("Failed to generate comprehensive report");
    } finally {
      setGeneratingReport(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "processing":
        return <ClockIcon className="h-5 w-5 text-yellow-500 animate-spin" />;
      case "pending":
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case "failed":
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
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
    if (score >= 0.7) return "text-red-600";
    if (score >= 0.4) return "text-yellow-600";
    return "text-green-600";
  };

  const getProjectStats = () => {
    if (!project)
      return { total: 0, completed: 0, processing: 0, pending: 0, failed: 0 };

    const stats = project.searches.reduce(
      (acc, search) => {
        acc.total++;
        acc[search.status]++;
        return acc;
      },
      { total: 0, completed: 0, processing: 0, pending: 0, failed: 0 }
    );

    return stats;
  };

  const getAverageRiskScore = () => {
    if (!project) return 0;

    const completedSearches = project.searches.filter(
      (search) => search.status === "completed" && search.results
    );

    if (completedSearches.length === 0) return 0;

    const totalRisk = completedSearches.reduce(
      (sum, search) => sum + (search.results?.riskScore || 0),
      0
    );

    return totalRisk / completedSearches.length;
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

  if (!project) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <FolderIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Project not found
          </h3>
          <p className="text-gray-600 mb-6">
            The project you're looking for doesn't exist or has been deleted.
          </p>
          <Button onClick={() => router.push("/dashboard/projects")}>
            Back to Projects
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const stats = getProjectStats();
  const averageRisk = getAverageRiskScore();

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
                <div className="p-2 bg-green-100 rounded-lg">
                  <FolderIcon className="h-6 w-6 text-green-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {project.name}
                </h1>
              </div>
              {project.description && (
                <p className="text-gray-600 max-w-3xl">{project.description}</p>
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

            {stats.completed > 0 && (
              <Button
                onClick={handleGenerateComprehensiveReport}
                loading={generatingReport}
                leftIcon={<DocumentTextIcon className="h-4 w-4" />}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Generate Report
              </Button>
            )}

            <Link href={`/dashboard/projects/${project._id}/edit`}>
              <Button
                variant="outline"
                leftIcon={<PencilIcon className="h-4 w-4" />}
              >
                Edit
              </Button>
            </Link>

            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleting}
              leftIcon={<TrashIcon className="h-4 w-4" />}
            >
              Delete
            </Button>
          </div>
        </div>

        {/* Project Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Project Information
              </h2>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Created</p>
                    <p className="text-sm text-gray-600">
                      {new Date(project.createdAt).toLocaleString()}
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
                      {new Date(project.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Total Searches
                    </p>
                    <p className="text-sm text-gray-600">
                      {stats.total} searches
                    </p>
                  </div>
                </div>

                {project.tags && project.tags.length > 0 && (
                  <div className="flex items-start space-x-3">
                    <TagIcon className="h-5 w-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Tags
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {project.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            <TagIcon className="h-3 w-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Statistics */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Statistics
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {stats.completed}
                    </div>
                    <div className="text-xs text-green-600">Completed</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {stats.processing}
                    </div>
                    <div className="text-xs text-yellow-600">Processing</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats.pending}
                    </div>
                    <div className="text-xs text-blue-600">Pending</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {stats.failed}
                    </div>
                    <div className="text-xs text-red-600">Failed</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Average Risk Score */}
            {stats.completed > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Average Risk Score
                </h3>
                <div className="text-center">
                  <div
                    className={`text-3xl font-bold ${getRiskColor(averageRisk)}`}
                  >
                    {Math.round(averageRisk * 100)}%
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Based on {stats.completed} completed analysis
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div
                      className={`h-2 rounded-full ${averageRisk >= 0.7 ? "bg-red-500" : averageRisk >= 0.4 ? "bg-yellow-500" : "bg-green-500"}`}
                      style={{ width: `${averageRisk * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Link href="/dashboard/search/new" className="block">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    leftIcon={<PlusIcon className="h-4 w-4" />}
                  >
                    Add New Search
                  </Button>
                </Link>

                <Link href="/reports/new" className="block">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    leftIcon={<DocumentTextIcon className="h-4 w-4" />}
                  >
                    Generate Report
                  </Button>
                </Link>

                <Link href="/dashboard/projects" className="block">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    leftIcon={<FolderIcon className="h-4 w-4" />}
                  >
                    View All Projects
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Searches in Project */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Searches in Project ({project.searches.length})
            </h2>
            <Link href="/dashboard/search/new">
              <Button
                leftIcon={<PlusIcon className="h-4 w-4" />}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Add Search
              </Button>
            </Link>
          </div>

          {project.searches.length === 0 ? (
            <div className="text-center py-8">
              <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No searches yet
              </h3>
              <p className="text-gray-600 mb-6">
                Start by adding some searches to analyze cartel behavior.
              </p>
              <Link href="/dashboard/search/new">
                <Button leftIcon={<PlusIcon className="h-4 w-4" />}>
                  Add First Search
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {project.searches.map((search) => (
                <div
                  key={search._id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(search.status)}
                        <h4 className="text-sm font-medium text-gray-900">
                          {search.searchName ||
                            `Analysis of ${search.companyNames.join(", ")}`}
                        </h4>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(search.status)}`}
                        >
                          {search.status}
                        </span>
                      </div>

                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <span className="font-medium">Companies:</span>{" "}
                          {search.companyNames.join(", ")}
                        </p>
                        {search.industries && search.industries.length > 0 && (
                          <p>
                            <span className="font-medium">Industries:</span>{" "}
                            {search.industries.join(", ")}
                          </p>
                        )}
                        {search.regions && search.regions.length > 0 && (
                          <p>
                            <span className="font-medium">Regions:</span>{" "}
                            {search.regions.join(", ")}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>
                            Created{" "}
                            {new Date(search.createdAt).toLocaleDateString()}
                          </span>
                          <span>
                            Updated{" "}
                            {new Date(search.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {search.status === "completed" && search.results && (
                        <div className="mt-3 grid grid-cols-2 gap-4">
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div
                              className={`text-sm font-bold ${getRiskColor(search.results.cartelProbability)}`}
                            >
                              {Math.round(
                                search.results.cartelProbability * 100
                              )}
                              %
                            </div>
                            <div className="text-xs text-gray-600">
                              Cartel Probability
                            </div>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div
                              className={`text-sm font-bold ${getRiskColor(search.results.riskScore)}`}
                            >
                              {Math.round(search.results.riskScore * 100)}%
                            </div>
                            <div className="text-xs text-gray-600">
                              Risk Score
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Link href={`/dashboard/search/${search._id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<EyeIcon className="h-4 w-4" />}
                        >
                          View
                        </Button>
                      </Link>

                      {search.status === "completed" && (
                        <Link href="/reports/new">
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<DocumentTextIcon className="h-4 w-4" />}
                          >
                            Report
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProjectDetailPage;
