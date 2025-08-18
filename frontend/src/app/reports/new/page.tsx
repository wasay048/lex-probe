"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { reportAPI, searchAPI } from "@/lib/api";
import toast from "react-hot-toast";
import {
  DocumentTextIcon,
  CheckIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

interface ReportFormData {
  searchId: string;
  title: string;
  description: string;
  sections: string[];
  format: "pdf" | "html" | "json";
  isPublic: boolean;
}

const NewReportPage: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<ReportFormData>({
    searchId: "",
    title: "",
    description: "",
    sections: [
      "executive_summary",
      "methodology",
      "findings",
      "recommendations",
    ],
    format: "pdf",
    isPublic: false,
  });
  const [availableSearches, setAvailableSearches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSearches, setLoadingSearches] = useState(true);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const availableSections = [
    {
      id: "executive_summary",
      label: "Executive Summary",
      description: "High-level overview of findings",
    },
    {
      id: "methodology",
      label: "Methodology",
      description: "Analysis approach and techniques used",
    },
    {
      id: "data_sources",
      label: "Data Sources",
      description: "Information about data used in analysis",
    },
    {
      id: "findings",
      label: "Key Findings",
      description: "Detailed analysis results",
    },
    {
      id: "risk_assessment",
      label: "Risk Assessment",
      description: "Evaluation of cartel probability",
    },
    {
      id: "market_analysis",
      label: "Market Analysis",
      description: "Market structure and competition analysis",
    },
    {
      id: "recommendations",
      label: "Recommendations",
      description: "Actionable next steps and suggestions",
    },
    {
      id: "appendix",
      label: "Appendix",
      description: "Supporting data and documentation",
    },
  ];

  useEffect(() => {
    loadAvailableSearches();
  }, []);

  const loadAvailableSearches = async () => {
    try {
      setLoadingSearches(true);
      const response = await searchAPI.getUserSearches({
        limit: 100,
        status: "completed", // Only show completed searches
      });
      setAvailableSearches(
        response.data.data.searches.filter(
          (search: any) => search.status === "completed"
        )
      );
    } catch (error) {
      console.error("Failed to load searches:", error);
      toast.error("Failed to load completed searches");
    } finally {
      setLoadingSearches(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.includes(sectionId)
        ? prev.sections.filter((id) => id !== sectionId)
        : [...prev.sections, sectionId],
    }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.searchId) {
      newErrors.searchId = "Please select a search to generate report from";
    }

    if (!formData.title.trim()) {
      newErrors.title = "Report title is required";
    }

    if (formData.sections.length === 0) {
      newErrors.sections = "Please select at least one section to include";
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
      const reportData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        searchIds: [formData.searchId], // Convert single searchId to array
        reportType: "analysis",
      };

      const response = await reportAPI.createReport(reportData);
      const reportId = response.data.data.report._id;

      toast.success("Report created successfully!");
      router.push(`/reports/${reportId}`);
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to generate report";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const selectedSearch = availableSearches.find(
    (search) => search._id === formData.searchId
  );

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Generate New Report
          </h1>
          <p className="text-gray-600">
            Create a comprehensive cartel detection report from your completed
            analysis.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Select Search */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MagnifyingGlassIcon className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Select Analysis
              </h2>
            </div>

            {loadingSearches ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">
                  Loading completed searches...
                </span>
              </div>
            ) : availableSearches.length === 0 ? (
              <div className="text-center py-8">
                <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  No completed searches available
                </p>
                <p className="text-sm text-gray-400">
                  Complete some analyses first to generate reports
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Choose a completed search
                  </label>
                  <select
                    name="searchId"
                    value={formData.searchId}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading}
                  >
                    <option value="">Select a search...</option>
                    {availableSearches.map((search: any) => (
                      <option key={search._id} value={search._id}>
                        {search.searchName ||
                          `Analysis of ${
                            search.companies
                              ?.map((c: any) => c.name)
                              .join(", ") ||
                            search.companyNames?.join(", ") ||
                            "Search Analysis"
                          }`}
                      </option>
                    ))}
                  </select>
                  {errors.searchId && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.searchId}
                    </p>
                  )}
                </div>

                {selectedSearch && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">
                      Selected Analysis
                    </h4>
                    <p className="text-sm text-blue-700">
                      <strong>Companies:</strong>{" "}
                      {selectedSearch.companies
                        ?.map((c: any) => c.name)
                        .join(", ") ||
                        selectedSearch.companyNames?.join(", ") ||
                        "No companies specified"}
                    </p>
                    <p className="text-sm text-blue-700">
                      <strong>Completed:</strong>{" "}
                      {new Date(selectedSearch.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Report Configuration */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DocumentTextIcon className="h-6 w-6 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Report Configuration
              </h2>
            </div>

            <div className="space-y-6">
              <Input
                label="Report Title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                error={errors.title}
                placeholder="e.g., Cartel Detection Analysis Report - TechCorp vs InnovateInc"
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
                  rows={3}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Provide additional context about this report..."
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Output Format
                  </label>
                  <select
                    name="format"
                    value={formData.format}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading}
                  >
                    <option value="pdf">
                      PDF - Professional document format
                    </option>
                    <option value="html">HTML - Web-friendly format</option>
                    <option value="json">
                      JSON - Data format for integration
                    </option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublic"
                    name="isPublic"
                    checked={formData.isPublic}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={loading}
                  />
                  <label
                    htmlFor="isPublic"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Make this report publicly accessible
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Report Sections */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckIcon className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Report Sections
                </h2>
              </div>
              <p className="text-sm text-gray-500">
                {formData.sections.length} section
                {formData.sections.length !== 1 ? "s" : ""} selected
              </p>
            </div>

            {errors.sections && (
              <p className="mb-4 text-sm text-red-600">{errors.sections}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableSections.map((section) => (
                <div
                  key={section.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    formData.sections.includes(section.id)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.sections.includes(section.id)}
                      onChange={() => toggleSection(section.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                      disabled={loading}
                    />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {section.label}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {section.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
              leftIcon={<DocumentTextIcon className="h-4 w-4" />}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Generate Report
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default NewReportPage;
