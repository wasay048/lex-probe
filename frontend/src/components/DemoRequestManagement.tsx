"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { API_ENDPOINTS } from "@/constants/apiEndpoints";

interface DemoRequest {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  jobTitle: string;
  phoneNumber?: string;
  companySize?: string;
  industry?: string;
  message?: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  signupAllowed: boolean;
  hasSignedUp: boolean;
  submittedAt: string;
  processedAt?: string;
  approvedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface DemoRequestStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

interface DemoRequestManagementProps {
  isAdmin: boolean;
}

export const DemoRequestManagement: React.FC<DemoRequestManagementProps> = ({
  isAdmin,
}) => {
  const [demoRequests, setDemoRequests] = useState<DemoRequest[]>([]);
  const [stats, setStats] = useState<DemoRequestStats>({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [selectedRequest, setSelectedRequest] = useState<DemoRequest | null>(
    null
  );
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  if (!isAdmin) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Access Denied</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>
                You need admin privileges to access the demo request management
                panel.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchStats();
    fetchDemoRequests();
  }, [filterStatus, page]);

  const fetchStats = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.DEMO_REQUESTS.STATS, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setStats(result.data);
      } else {
        console.error("Stats fetch failed:", response.status);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchDemoRequests = async (reset = false) => {
    try {
      console.log("Fetching demo requests...");
      const params = new URLSearchParams({
        page: reset ? "1" : page.toString(),
        limit: "10",
        ...(filterStatus && { status: filterStatus }),
      });

      const response = await fetch(
        `${API_ENDPOINTS.DEMO_REQUESTS.GET_ALL}?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      console.log("Demo requests response status:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("Demo requests result:", result);
        console.log("Extracted requests:", result.data.demoRequests);
        console.log("Requests array length:", result.data.demoRequests?.length);

        if (reset) {
          setDemoRequests(result.data.demoRequests || []);
          setPage(1);
        } else {
          setDemoRequests((prev) => [
            ...prev,
            ...(result.data.demoRequests || []),
          ]);
        }
        setHasMore(result.data.pagination.page < result.data.pagination.pages);

        console.log(
          "After setting demoRequests, length should be:",
          result.data.demoRequests?.length || 0
        );
      } else {
        console.error("Failed to fetch demo requests:", response.status);
        toast.error("Failed to fetch demo requests");
      }
    } catch (error) {
      console.error("Error fetching demo requests:", error);
      toast.error("Error loading demo requests");
    } finally {
      console.log("Setting loading to false");
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      const response = await fetch(
        API_ENDPOINTS.DEMO_REQUESTS.UPDATE(requestId),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify({
            status: "approved",
            signupAllowed: true,
          }),
        }
      );

      if (response.ok) {
        toast.success("Demo request approved successfully");
        fetchStats();
        fetchDemoRequests(true);
      } else {
        const result = await response.json();
        toast.error(result.message || "Failed to approve demo request");
      }
    } catch (error) {
      console.error("Error approving demo request:", error);
      toast.error("Error approving demo request");
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      const response = await fetch(
        API_ENDPOINTS.DEMO_REQUESTS.UPDATE(selectedRequest._id),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify({
            status: "rejected",
            rejectionReason: rejectionReason.trim(),
            signupAllowed: false,
          }),
        }
      );

      if (response.ok) {
        toast.success("Demo request rejected");
        setShowRejectionModal(false);
        setSelectedRequest(null);
        setRejectionReason("");
        fetchStats();
        fetchDemoRequests(true);
      } else {
        const result = await response.json();
        toast.error(result.message || "Failed to reject demo request");
      }
    } catch (error) {
      console.error("Error rejecting demo request:", error);
      toast.error("Error rejecting demo request");
    }
  };

  const openRejectionModal = (request: DemoRequest) => {
    setSelectedRequest(request);
    setShowRejectionModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string, hasSignedUp: boolean) => {
    const baseClasses =
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";

    if (status === "pending") {
      return (
        <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
          Pending
        </span>
      );
    } else if (status === "approved") {
      if (hasSignedUp) {
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800`}>
            Approved & Signed Up
          </span>
        );
      } else {
        return (
          <span className={`${baseClasses} bg-blue-100 text-blue-800`}>
            Approved
          </span>
        );
      }
    } else if (status === "rejected") {
      return (
        <span className={`${baseClasses} bg-red-100 text-red-800`}>
          Rejected
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  console.log("Render - demoRequests length:", demoRequests.length);
  console.log("Render - demoRequests array:", demoRequests);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pending
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.pending}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Approved
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.approved}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Rejected
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.rejected}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.total}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Demo Request Management
          </h3>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <label
                htmlFor="status-filter"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Filter by Status
              </label>
              <select
                id="status-filter"
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPage(1);
                  fetchDemoRequests(true);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Demo Requests List */}
          <div className="space-y-4">
            {demoRequests.map((request) => (
              <div
                key={request._id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="text-lg font-medium text-gray-900">
                        {request.firstName} {request.lastName}
                      </h4>
                      {getStatusBadge(request.status, request.hasSignedUp)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                      <div>
                        <strong>Email:</strong> {request.email}
                      </div>
                      <div>
                        <strong>Company:</strong> {request.company}
                      </div>
                      <div>
                        <strong>Job Title:</strong> {request.jobTitle}
                      </div>
                      {request.phoneNumber && (
                        <div>
                          <strong>Phone:</strong> {request.phoneNumber}
                        </div>
                      )}
                      {request.industry && (
                        <div>
                          <strong>Industry:</strong> {request.industry}
                        </div>
                      )}
                      {request.companySize && (
                        <div>
                          <strong>Company Size:</strong> {request.companySize}
                        </div>
                      )}
                      <div>
                        <strong>Submitted:</strong>{" "}
                        {formatDate(request.submittedAt)}
                      </div>
                      {request.processedAt && (
                        <div>
                          <strong>Processed:</strong>{" "}
                          {formatDate(request.processedAt)}
                        </div>
                      )}
                    </div>

                    {request.message && (
                      <div className="mt-3">
                        <strong className="text-sm text-gray-700">
                          Message:
                        </strong>
                        <p className="text-sm text-gray-600 mt-1">
                          {request.message}
                        </p>
                      </div>
                    )}

                    {request.rejectionReason && (
                      <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                        <strong className="text-sm text-red-700">
                          Rejection Reason:
                        </strong>
                        <p className="text-sm text-red-600 mt-1">
                          {request.rejectionReason}
                        </p>
                      </div>
                    )}

                    {request.approvedBy && (
                      <div className="mt-2 text-sm text-gray-600">
                        <strong>Approved by:</strong>{" "}
                        {request.approvedBy.firstName}{" "}
                        {request.approvedBy.lastName}
                      </div>
                    )}
                  </div>

                  {request.status === "pending" && (
                    <div className="mt-4 lg:mt-0 lg:ml-4 flex space-x-2">
                      <button
                        onClick={() => handleApprove(request._id)}
                        className="px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => openRejectionModal(request)}
                        className="px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {demoRequests.length === 0 && (
              <div className="text-center py-6 text-gray-500">
                No demo requests found.
              </div>
            )}

            {hasMore && (
              <div className="text-center">
                <button
                  onClick={() => {
                    setPage((prev) => prev + 1);
                    fetchDemoRequests();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Load More
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectionModal && selectedRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Reject Demo Request
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Please provide a reason for rejecting{" "}
                {selectedRequest.firstName} {selectedRequest.lastName}'s demo
                request:
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={4}
                placeholder="Enter rejection reason..."
              />
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => {
                    setShowRejectionModal(false);
                    setSelectedRequest(null);
                    setRejectionReason("");
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
