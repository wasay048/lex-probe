"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { projectAPI, searchAPI } from "@/lib/api";
import toast from "react-hot-toast";
import {
  FolderIcon,
  PlusIcon,
  XMarkIcon,
  TagIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

interface ProjectFormData {
  name: string;
  description: string;
  tags: string[];
  searchIds: string[];
}

interface Search {
  _id: string;
  searchName?: string;
  companyNames: string[];
  status: string;
  createdAt: string;
}

const NewProjectPage: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    description: "",
    tags: [],
    searchIds: [],
  });
  const [currentTag, setCurrentTag] = useState("");
  const [availableSearches, setAvailableSearches] = useState<Search[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSearches, setLoadingSearches] = useState(true);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadAvailableSearches();
  }, []);

  const loadAvailableSearches = async () => {
    try {
      setLoadingSearches(true);
      const response = await searchAPI.getUserSearches({ limit: 100 });
      setAvailableSearches(response.data.data.searches);
    } catch (error) {
      console.error("Failed to load searches:", error);
      toast.error("Failed to load available searches");
    } finally {
      setLoadingSearches(false);
    }
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()],
      }));
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const toggleSearch = (searchId: string) => {
    setFormData((prev) => ({
      ...prev,
      searchIds: prev.searchIds.includes(searchId)
        ? prev.searchIds.filter((id) => id !== searchId)
        : [...prev.searchIds, searchId],
    }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Project name is required";
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Project name must be at least 3 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const projectData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        searchIds:
          formData.searchIds.length > 0 ? formData.searchIds : undefined,
      };

      const response = await projectAPI.createProject(projectData);
      const projectId = response.data.data.project._id;

      toast.success("Project created successfully!");
      router.push(`/dashboard/projects/${projectId}`);
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to create project";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Create New Project
        </h1>
        <p className="text-gray-600">
          Organize your cartel detection searches and analyses into a
          structured project.
        </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <FolderIcon className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Project Information
              </h2>
            </div>

            <div className="space-y-6">
              <Input
                label="Project Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                error={errors.name}
                placeholder="e.g., Tech Market Analysis Q4 2024"
                disabled={loading}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe the purpose and scope of this project..."
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TagIcon className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Tags (Optional)
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex space-x-3">
                <Input
                  placeholder="Add a tag (e.g., 'technology', 'quarterly-analysis')"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addTag())
                  }
                  className="flex-1"
                  disabled={loading}
                />
                <Button
                  type="button"
                  onClick={addTag}
                  disabled={!currentTag.trim() || loading}
                  leftIcon={<PlusIcon className="h-4 w-4" />}
                >
                  Add Tag
                </Button>
              </div>

              {formData.tags.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    Tags ({formData.tags.length}):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <div
                        key={tag}
                        className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
                      >
                        <TagIcon className="h-3 w-3" />
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-blue-500 hover:text-blue-700"
                          disabled={loading}
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Add Searches */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MagnifyingGlassIcon className="h-6 w-6 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Include Searches (Optional)
              </h2>
            </div>

            {loadingSearches ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading searches...</span>
              </div>
            ) : availableSearches.length === 0 ? (
              <div className="text-center py-8">
                <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No searches available</p>
                <p className="text-sm text-gray-400">
                  Create some searches first to add them to projects
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {availableSearches.map((search) => (
                  <div
                    key={search._id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      formData.searchIds.includes(search._id)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => toggleSearch(search._id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={formData.searchIds.includes(search._id)}
                            onChange={() => toggleSearch(search._id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">
                              {search.searchName ||
                                `Analysis of ${search.companyNames?.join(", ")}`}
                            </h4>
                            <p className="text-sm text-gray-500">
                              Companies: {search.companyNames?.join(", ")}
                            </p>
                            <p className="text-xs text-gray-400">
                              Created:{" "}
                              {new Date(search.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          search.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : search.status === "processing"
                              ? "bg-yellow-100 text-yellow-800"
                              : search.status === "pending"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-red-100 text-red-800"
                        }`}
                      >
                        {search.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {formData.searchIds.length > 0 && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">
                  {formData.searchIds.length} search
                  {formData.searchIds.length !== 1 ? "es" : ""} selected
                </p>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              leftIcon={<FolderIcon className="h-4 w-4" />}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              Create Project
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewProjectPage;
