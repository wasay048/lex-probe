"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { projectAPI } from "@/lib/api";
import toast from "react-hot-toast";
import {
  FolderIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  TagIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

interface Project {
  _id: string;
  name: string;
  description?: string;
  tags?: string[];
  searches: any[];
  createdAt: string;
  updatedAt: string;
  user: string;
}

const DashboardProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, [currentPage, tagFilter]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 12,
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      if (tagFilter) {
        params.tags = tagFilter;
      }

      const response = await projectAPI.getUserProjects(params);
      if (response.data.success) {
        setProjects(response.data.data?.projects || []);
        setTotalPages(response.data.data?.pagination?.totalPages || 1);
      }
    } catch (error: any) {
      console.error("Failed to load projects:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to load projects";
      toast.error(errorMessage);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this project? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setDeleting(projectId);
      await projectAPI.deleteProject(projectId);
      toast.success("Project deleted successfully");
      loadProjects();
    } catch (error: any) {
      console.error("Failed to delete project:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to delete project";
      toast.error(errorMessage);
    } finally {
      setDeleting(null);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadProjects();
  };

  const getAllTags = () => {
    const allTags = projects.flatMap((project) => project.tags || []);
    return Array.from(new Set(allTags));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getProjectStatusBadge = (searchCount: number) => {
    if (searchCount === 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Empty
        </span>
      );
    } else if (searchCount < 5) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          {searchCount} searches
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          {searchCount} searches
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600">
            Organize your cartel detection searches into structured projects
          </p>
          </div>
          <Link href="/dashboard/projects/new">
            <Button>
              <PlusIcon className="h-5 w-5 mr-2" />
              New Project
            </Button>
          </Link>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                title="Filter projects by tag"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Tags</option>
                {getAllTags().map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={handleSearch} variant="outline">
              Search
            </Button>
          </div>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <FolderIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No projects found
            </h3>
            <p className="text-gray-500 mb-6">
              Get started by creating your first project to organize your cartel
              detection searches.
            </p>
            <Link href="/dashboard/projects/new">
              <Button>
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Your First Project
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <FolderIcon className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {project.name}
                        </h3>
                        {project.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {project.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    {getProjectStatusBadge(project.searches?.length || 0)}
                    <div className="flex items-center text-sm text-gray-500">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      {formatDate(project.createdAt)}
                    </div>
                  </div>

                  {project.tags && project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          <TagIcon className="h-3 w-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                      {project.tags.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{project.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <Link href={`/dashboard/projects/${project._id}`}>
                        <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View
                        </button>
                      </Link>
                      <Link href={`/dashboard/projects/${project._id}/edit`}>
                        <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                          <PencilIcon className="h-4 w-4 mr-1" />
                          Edit
                        </button>
                      </Link>
                    </div>
                    <button
                      onClick={() => handleDelete(project._id)}
                      disabled={deleting === project._id}
                      className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      {deleting === project._id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="inline-flex items-center px-4 py-2 text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardProjectsPage;
