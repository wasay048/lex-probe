"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { reportAPI } from "@/lib/api";
import toast from "react-hot-toast";
import {
  DocumentTextIcon,
  PlusIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface Report {
  _id: string;
  title: string;
  description?: string;
  search?: {
    _id: string;
    searchName?: string;
    companyNames?: string[];
    companies?: Array<{
      name: string;
      website: string;
      industry?: string;
    }>;
  };
  status: "pending" | "processing" | "completed" | "failed";
  format: "pdf" | "html" | "json";
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  downloadUrl?: string;
}

const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formatFilter, setFormatFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, [currentPage, statusFilter, formatFilter]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 10,
      };

      const response = await reportAPI.getUserReports(params);
      setReports(response.data.data.reports);
      setTotalPages(response.data.data.pagination.totalPages);
    } catch (error) {
      console.error("Failed to load reports:", error);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reportId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this report? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setDeleting(reportId);
      await reportAPI.deleteReport(reportId);
      toast.success("Report deleted successfully");
      loadReports();
    } catch (error) {
      console.error("Failed to delete report:", error);
      toast.error("Failed to delete report");
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = async (reportId: string) => {
    try {
      setDownloading(reportId);

      // Now this is JSON
      const response = await reportAPI.downloadReport(reportId);
      const { url, filename } = response.data.data;

      if (!url) {
        throw new Error("Signed URL not received");
      }

      const link = document.createElement("a");
      link.href = url;
      link.download = filename || `report-${reportId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Report downloaded successfully");
    } catch (error) {
      console.error("Failed to download report:", error);
      toast.error("Failed to download report");
    } finally {
      setDownloading(null);
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

  const getFormatColor = (format: string) => {
    switch (format) {
      case "pdf":
        return "bg-red-100 text-red-800";
      case "html":
        return "bg-blue-100 text-blue-800";
      case "json":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      searchTerm === "" ||
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.search?.companyNames?.some((company) =>
        company.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      report.search?.companies?.some((company) =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesStatus =
      statusFilter === "all" || report.status === statusFilter;
    const matchesFormat =
      formatFilter === "all" || report.format === formatFilter;

    return matchesSearch && matchesStatus && matchesFormat;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
            <p className="mt-2 text-gray-600">
              Generate, manage, and share your cartel detection analysis
              reports.
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link href="/reports/new">
              <Button
                leftIcon={<PlusIcon className="h-4 w-4" />}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Generate Report
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
            />

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div>
              <select
                value={formatFilter}
                onChange={(e) => setFormatFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Formats</option>
                <option value="pdf">PDF</option>
                <option value="html">HTML</option>
                <option value="json">JSON</option>
              </select>
            </div>

            <div className="flex items-center justify-end">
              <Button
                variant="outline"
                onClick={loadReports}
                leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
              >
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Reports List */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading reports...</span>
            </div>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No reports found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== "all" || formatFilter !== "all"
                ? "No reports match your current filters."
                : "Generate your first report from completed analyses."}
            </p>
            <Link href="/reports/new">
              <Button leftIcon={<PlusIcon className="h-4 w-4" />}>
                Generate Report
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <div
                key={report._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(report.status)}
                      <h3 className="text-lg font-semibold text-gray-900">
                        {report.title}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}
                      >
                        {report.status}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getFormatColor(report.format)}`}
                      >
                        {report.format.toUpperCase()}
                      </span>
                      {report.isPublic && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Public
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <span className="font-medium">Search:</span>{" "}
                        {report.search?.searchName ||
                          (report.search?.companyNames
                            ? `Analysis of ${report.search.companyNames.join(", ")}`
                            : report.search?.companies
                              ? `Analysis of ${report.search.companies.map((c: any) => c.name).join(", ")}`
                              : "Analysis Report")}
                      </p>
                      <p>
                        <span className="font-medium">Companies:</span>{" "}
                        {report.search?.companyNames
                          ? report.search.companyNames.join(", ")
                          : report.search?.companies
                            ? report.search.companies
                                .map((c: any) => c.name)
                                .join(", ")
                            : "N/A"}
                      </p>
                      {report.description && (
                        <p>
                          <span className="font-medium">Description:</span>{" "}
                          {report.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          Created{" "}
                          {new Date(report.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          Updated{" "}
                          {new Date(report.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link href={`/reports/${report._id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<EyeIcon className="h-4 w-4" />}
                      >
                        View
                      </Button>
                    </Link>

                    {report.status === "completed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(report._id)}
                        loading={downloading === report._id}
                        leftIcon={<ArrowDownTrayIcon className="h-4 w-4" />}
                      >
                        Download
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<ShareIcon className="h-4 w-4" />}
                    >
                      Share
                    </Button>

                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(report._id)}
                      loading={deleting === report._id}
                      leftIcon={<TrashIcon className="h-4 w-4" />}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4">
            <div className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ReportsPage;
