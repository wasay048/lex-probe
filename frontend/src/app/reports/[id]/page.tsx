"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import { reportAPI } from "@/lib/api";
import toast from "react-hot-toast";
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  TagIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";

interface Report {
  _id: string;
  title: string;
  description?: string;
  search: {
    _id: string;
    searchName?: string;
    companyNames?: string[];
    companies?: Array<{ name: string; website?: string; industry?: string }>;
  };
  status: "pending" | "processing" | "completed" | "failed";
  format: "pdf" | "html" | "json";
  sections: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  content?: any;
}

const ReportDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const reportId = params.id as string;

  useEffect(() => {
    if (reportId) {
      loadReport();
    }
  }, [reportId]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const response = await reportAPI.getReport(reportId);
      setReport(response.data.data.report);
    } catch (error) {
      console.error("Failed to load report:", error);
      toast.error("Failed to load report");
      router.push("/reports");
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

  const handleDelete = async () => {
    if (!report) return;

    if (
      !confirm(
        "Are you sure you want to delete this report? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setDeleting(true);
      await reportAPI.deleteReport(report._id);
      toast.success("Report deleted successfully");
      router.push("/reports");
    } catch (error) {
      console.error("Failed to delete report:", error);
      toast.error("Failed to delete report");
    } finally {
      setDeleting(false);
    }
  };

  const handleShare = async () => {
    if (!report) return;

    const shareUrl = `${window.location.origin}/public/reports/${report._id}`;

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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!report) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Report not found
          </h3>
          <p className="text-gray-600 mb-6">
            The report you're looking for doesn't exist or has been deleted.
          </p>
          <Button onClick={() => router.push("/reports")}>
            Back to Reports
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
                {getStatusIcon(report.status)}
                <h1 className="text-3xl font-bold text-gray-900">
                  {report.title}
                </h1>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}
                >
                  {report.status}
                </span>
              </div>
              {report.description && (
                <p className="text-gray-600">{report.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {report.status === "completed" && (
              <Button
                onClick={handleDownload}
                loading={downloading}
                leftIcon={<ArrowDownTrayIcon className="h-4 w-4" />}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Download
              </Button>
            )}

            <Button
              variant="outline"
              onClick={handleShare}
              leftIcon={<ShareIcon className="h-4 w-4" />}
            >
              Share
            </Button>

            <Button
              variant="outline"
              leftIcon={<PencilIcon className="h-4 w-4" />}
            >
              Edit
            </Button>

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

        {/* Report Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Report Information
              </h2>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Analysis Source
                    </p>
                    <p className="text-sm text-gray-600">
                      {report.search.searchName ||
                        `Analysis of ${(report.search.companyNames || report.search.companies?.map((c) => c.name))?.join(", ") || "Unknown Companies"}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <TagIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Companies Analyzed
                    </p>
                    <p className="text-sm text-gray-600">
                      {report.search.companyNames.join(", ")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Format</p>
                    <p className="text-sm text-gray-600">
                      {report.format.toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Created</p>
                    <p className="text-sm text-gray-600">
                      {new Date(report.createdAt).toLocaleString()}
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
                      {new Date(report.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
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
                {getStatusIcon(report.status)}
                <div>
                  <p className="text-sm font-medium text-gray-900 capitalize">
                    {report.status}
                  </p>
                  <p className="text-xs text-gray-500">
                    {report.status === "completed" && "Ready for download"}
                    {report.status === "processing" && "Generating report..."}
                    {report.status === "pending" && "Waiting to be processed"}
                    {report.status === "failed" && "Generation failed"}
                  </p>
                </div>
              </div>
            </div>

            {/* Sections */}
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

            {/* Access */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Access
              </h3>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${report.isPublic ? "bg-green-500" : "bg-gray-400"}`}
                ></div>
                <span className="text-sm text-gray-700">
                  {report.isPublic ? "Public" : "Private"}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {report.isPublic
                  ? "This report can be accessed by anyone with the link"
                  : "Only you can access this report"}
              </p>
            </div>
          </div>
        </div>

        {/* Report Content */}
        {report.status === "completed" && report.content ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Report Preview
            </h2>
            <div className="prose max-w-none">
              {report.format === "html" ? (
                <div dangerouslySetInnerHTML={{ __html: report.content }} />
              ) : (
                <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {JSON.stringify(report.content, null, 2)}
                </pre>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {report.status === "processing" && "Report is being generated"}
              {report.status === "pending" && "Report is queued for generation"}
              {report.status === "failed" && "Report generation failed"}
            </h3>
            <p className="text-gray-600">
              {report.status === "processing" &&
                "Please wait while we generate your report. This may take a few minutes."}
              {report.status === "pending" &&
                "Your report is in the queue and will be processed soon."}
              {report.status === "failed" &&
                "There was an error generating your report. Please try again."}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ReportDetailPage;
