"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { projectAPI } from "@/lib/api";
import toast from "react-hot-toast";
import {
  ArrowLeftIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const NewProjectPage: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      if (tag && !formData.tags.includes(tag)) {
        setFormData((prev) => ({
          ...prev,
          tags: [...prev.tags, tag],
        }));
        setTagInput("");
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Project name is required");
      return;
    }

    try {
      setLoading(true);
      const response = await projectAPI.createProject({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
      });

      if (response.data.success) {
        toast.success("Project created successfully");
        router.push("/dashboard/projects");
      }
    } catch (error: any) {
      console.error("Failed to create project:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to create project";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-gray-600 hover:text-gray-800"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          Create New Project
        </h1>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Project Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Project Name *
              </label>
              <Input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter project name..."
                required
                className="w-full"
              />
              <p className="mt-1 text-sm text-gray-500">
                Choose a descriptive name for your cartel detection project.
              </p>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Describe the purpose and scope of this project..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Optional description to help organize and identify this project.
              </p>
            </div>

            {/* Tags */}
            <div>
              <label
                htmlFor="tags"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Tags
              </label>

              {/* Display existing tags */}
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        title={`Remove ${tag} tag`}
                        className="ml-2 inline-flex items-center p-0.5 rounded-full hover:bg-blue-200 focus:outline-none"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <Input
                type="text"
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Type a tag and press Enter or comma..."
                className="w-full"
              />
              <p className="mt-1 text-sm text-gray-500">
                Add tags to categorize your project. Press Enter or comma to add
                each tag.
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !formData.name.trim()}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Create Project
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            About Projects
          </h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>
              • Organize your cartel detection searches into structured projects
            </li>
            <li>• Associate multiple searches with a single investigation</li>
            <li>
              • Use tags to categorize projects by industry, region, or
              investigation type
            </li>
            <li>• Track progress and findings across related searches</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NewProjectPage;
