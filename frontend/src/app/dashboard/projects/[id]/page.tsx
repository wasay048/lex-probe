"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { projectAPI } from "@/lib/api";
import toast from "react-hot-toast";
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  FolderIcon,
  CalendarIcon,
  TagIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

interface Project {
  _id: string;
  name: string;
  description?: string;
  tags?: string[];
  searches: Array<{
    _id: string;
    searchQuery: string;
    riskLevel?: string;
    foundIssues?: number;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
  user: string;
}

const ProjectDetailPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      console.log("Loading project with ID:", projectId); // Debug
      const response = await projectAPI.getProjectById(projectId);
      console.log("Project API response:", response.data); // Debug

      if (response.data.success) {
        console.log("Full response data:", response.data); // Debug
        console.log("Project data:", response.data.data); // Debug

        // The project data is nested under data.project
        const projectData = response.data.data?.project || response.data.data;
        console.log("Setting project to:", projectData); // Debug
        setProject(projectData);
      } else {
        console.error("Project API error:", response.data.message);
        toast.error(response.data.message || "Failed to load project");
        router.push("/dashboard/projects");
      }
    } catch (error: any) {
      console.error("Failed to load project:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to load project";

      if (error.response?.status === 401) {
        toast.error("Please log in again to access this project");
        router.push("/auth/login");
      } else if (error.response?.status === 404) {
        toast.error("Project not found or you don't have access to it");
        router.push("/dashboard/projects");
      } else {
        toast.error(errorMessage);
        router.push("/dashboard/projects");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this project? This action cannot be undone and will remove all associated searches."
      )
    ) {
      return;
    }

    try {
      setDeleting(true);
      await projectAPI.deleteProject(projectId);
      toast.success("Project deleted successfully");
      router.push("/dashboard/projects");
    } catch (error: any) {
      console.error("Failed to delete project:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to delete project";
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRiskLevelBadge = (riskLevel?: string) => {
    switch (riskLevel?.toLowerCase()) {
      case "high":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            High Risk
          </span>
        );
      case "medium":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Medium Risk
          </span>
        );
      case "low":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Low Risk
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Analyzing
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Project not found
          </h3>
          <p className="text-gray-500 mb-6">
            The project you're looking for doesn't exist or you don't have
            access to it.
          </p>
          <Link href="/dashboard/projects">
            <Button>
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Projects
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  console.log("🔍 About to render, project state:", project);
  console.log("🔍 Project name:", project?.name);
  console.log("🔍 Project ID:", project?._id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-gray-600 hover:text-gray-800"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back
            </button>
            <div className="flex items-center space-x-3">
              <FolderIcon className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {project?.name || "Untitled Project"}
                </h1>
                <p className="text-gray-600">
                  Created{" "}
                  {project?.createdAt
                    ? formatDate(project.createdAt)
                    : "Unknown date"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <Link href={`/dashboard/projects/${project._id}/edit`}>
              <Button variant="outline">
                <PencilIcon className="h-5 w-5 mr-2" />
                Edit
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={deleting}
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              <TrashIcon className="h-5 w-5 mr-2" />
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>

        {/* Project Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Project Information
              </h3>
              {project.description && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Description
                  </p>
                  <p className="text-gray-600">{project.description}</p>
                </div>
              )}
              {project.tags && project.tags.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        <TagIcon className="h-3 w-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Project Statistics
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Searches</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {project.searches?.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Updated</span>
                  <span className="text-sm text-gray-900">
                    {formatDate(project.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Searches */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Associated Searches ({project.searches?.length || 0})
              </h3>
              <Link href="/dashboard/search/new">
                <Button>
                  <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                  New Search
                </Button>
              </Link>
            </div>
          </div>

          {project.searches && project.searches.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {project.searches.map((search) => (
                <div key={search._id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-medium text-gray-900 truncate">
                          {search.searchQuery}
                        </h4>
                        {search.riskLevel &&
                          getRiskLevelBadge(search.riskLevel)}
                      </div>
                      <div className="flex items-center text-sm text-gray-500 space-x-4">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          {formatDate(search.createdAt)}
                        </div>
                        {search.foundIssues !== undefined && (
                          <div className="flex items-center">
                            <ChartBarIcon className="h-4 w-4 mr-1" />
                            {search.foundIssues} findings
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Link href={`/dashboard/search/${search._id}`}>
                        <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View Results
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <MagnifyingGlassIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                No searches yet
              </h4>
              <p className="text-gray-500 mb-6">
                Start by creating a new search to analyze for cartel behavior.
              </p>
              <Link href="/dashboard/search/new">
                <Button>
                  <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                  Create First Search
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailPage;
