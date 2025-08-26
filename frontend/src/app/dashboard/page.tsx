"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { dashboardAPI } from "@/lib/api";
import {
  BuildingOfficeIcon,
  ChartBarIcon,
  DocumentMagnifyingGlassIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

// Dashboard data fetcher using real API
const fetchDashboardData = async () => {
  try {
    console.log("🚀 Fetching dashboard data...");
    const response = await dashboardAPI.getDashboardStats();
    console.log("📡 Raw API response:", response.data);

    if (response.data.success) {
      const stats = response.data.data;
      console.log("✅ Parsed stats:", stats);

      // Return data in the format expected by the component
      const result = {
        riskData: stats.riskData || {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
        },
        comparisonData: stats.comparisonData || [
          { month: "Jan", alerts: 0, investigations: 0 },
          { month: "Feb", alerts: 0, investigations: 0 },
          { month: "Mar", alerts: 0, investigations: 0 },
          { month: "Apr", alerts: 0, investigations: 0 },
          { month: "May", alerts: 0, investigations: 0 },
          { month: "Jun", alerts: 0, investigations: 0 },
        ],
        recentAlerts: stats.recentAlerts || [],
        stats: {
          totalScans: stats.stats?.totalScans || 0,
          activeInvestigations: stats.stats?.activeInvestigations || 0,
          companiesMonitored: stats.stats?.companiesMonitored || 0,
          riskScore: stats.stats?.riskScore || 0,
        },
      };
      console.log("🎯 Final dashboard data:", result);
      return result;
    }

    throw new Error(response.data.message || "Failed to fetch dashboard data");
  } catch (error) {
    console.error("Dashboard API Error:", error);
    throw error;
  }
};

const DashboardPage: React.FC = () => {
  const { data, error, isLoading } = useQuery({
    queryKey: ["dashboardData"],
    queryFn: fetchDashboardData,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Debug logging
  console.log("🔍 Dashboard Debug:", {
    isLoading,
    error: error?.message,
    data: data?.stats,
    hasData: !!data,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Error Loading Dashboard
        </h3>
        <p className="text-gray-600">
          {error instanceof Error
            ? error.message
            : "An unexpected error occurred"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Monitor cartel detection activities and system performance.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Scans</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.stats.totalScans.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-teal-100 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-teal-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Investigations
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {data?.stats.activeInvestigations}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Companies Monitored
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {data?.stats.companiesMonitored}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <UserGroupIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Risk Score</p>
                <p className="text-2xl font-bold text-red-600">
                  {data?.stats.riskScore}%
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <ShieldCheckIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Risk Distribution Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Risk Distribution
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Critical</span>
                <span className="text-sm font-medium text-red-600">
                  {data?.riskData.critical}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-600 h-2 rounded-full"
                  style={{ width: `${(data?.riskData.critical || 0) / 2.41}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">High</span>
                <span className="text-sm font-medium text-orange-600">
                  {data?.riskData.high}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-600 h-2 rounded-full"
                  style={{ width: `${(data?.riskData.high || 0) / 2.41}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Medium</span>
                <span className="text-sm font-medium text-yellow-600">
                  {data?.riskData.medium}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-600 h-2 rounded-full"
                  style={{ width: `${(data?.riskData.medium || 0) / 2.41}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Low</span>
                <span className="text-sm font-medium text-green-600">
                  {data?.riskData.low}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${(data?.riskData.low || 0) / 2.41}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Recent Alerts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Alerts
            </h3>
            <div className="space-y-4">
              {data?.recentAlerts && data.recentAlerts.length > 0 ? (
                data.recentAlerts.map((alert: any) => (
                  <div key={alert.id} className="flex items-start space-x-3">
                    <div
                      className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                        alert.severity === "critical"
                          ? "bg-red-500"
                          : alert.severity === "high"
                            ? "bg-orange-500"
                            : "bg-yellow-500"
                      }`}
                    ></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {alert.title}
                      </p>
                      <p className="text-xs text-gray-500">{alert.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <ExclamationTriangleIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  </div>
                  <p className="text-sm text-gray-500">No recent alerts</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Alerts will appear here when cartel detection activities
                    trigger warnings
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
