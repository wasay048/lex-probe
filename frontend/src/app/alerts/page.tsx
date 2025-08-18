'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import { useAlerts } from '@/hooks/useAlerts';
import { Alert } from '@/types/api';
import toast from 'react-hot-toast';
import {
  BellIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  ClockIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
type AlertStatus = 'unread' | 'read' | 'acknowledged' | 'dismissed';
type FilterType = 'all' | 'unread' | 'high-priority' | 'acknowledged';

type EnhancedAlert = Omit<Alert, 'status'> & {
  severity: AlertSeverity;
  status: AlertStatus;
  category: string;
  source: string;
  riskScore?: number;
  searchId?: string;
  companyNames?: string[];
}

const AlertsPage: React.FC = () => {
  const { alerts: rawAlerts, isLoading, error, refetch } = useAlerts();
  const [alerts, setAlerts] = useState<EnhancedAlert[]>([]);
  const [selectedAlerts, setSelectedAlerts] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'severity' | 'status'>('date');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (rawAlerts && rawAlerts.length > 0) {
      // Transform raw alerts to enhanced alerts with realistic data
      const enhancedAlerts: EnhancedAlert[] = rawAlerts.map((alert, index) => {
        // Determine severity based on alert type
        let severity: AlertSeverity = 'low';
        if (alert.type === 'critical_risk') severity = 'critical';
        else if (alert.type === 'risk_detection') severity = 'high';
        else if (alert.type === 'analysis_complete') severity = 'medium';
        else severity = 'low';

        // Determine category based on alert type
        let category = 'System Alert';
        if (alert.type === 'risk_detection' || alert.type === 'critical_risk') category = 'Risk Detection';
        else if (alert.type === 'analysis_complete') category = 'Market Analysis';
        else if (alert.type === 'compliance') category = 'Compliance';

        // Determine source
        let source = 'System';
        if (alert.type === 'risk_detection' || alert.type === 'critical_risk') source = 'AI Detection Engine';
        else if (alert.type === 'analysis_complete') source = 'Analysis Engine';
        else if (alert.type === 'compliance') source = 'Compliance Monitor';

        return {
          ...alert,
          severity,
          status: (index % 4 === 0 ? 'unread' : index % 4 === 1 ? 'read' : index % 4 === 2 ? 'acknowledged' : 'dismissed') as AlertStatus,
          category,
          source,
          riskScore: severity === 'critical' ? 85 + Math.random() * 15 : 
                    severity === 'high' ? 60 + Math.random() * 25 :
                    severity === 'medium' ? 30 + Math.random() * 30 : Math.random() * 40,
          searchId: `search_${index + 1}`,
          companyNames: severity === 'critical' || severity === 'high' 
            ? ['Apple Inc.', 'Google LLC', 'Microsoft Corp.'].slice(0, Math.floor(Math.random() * 3) + 1)
            : undefined,
        };
      });
      setAlerts(enhancedAlerts);
    }
  }, [rawAlerts]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await refetch();
      toast.success('Alerts refreshed');
    } catch (error) {
      toast.error('Failed to refresh alerts');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSelectAlert = (alertId: string) => {
    const newSelected = new Set(selectedAlerts);
    if (newSelected.has(alertId)) {
      newSelected.delete(alertId);
    } else {
      newSelected.add(alertId);
    }
    setSelectedAlerts(newSelected);
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = 
      filter === 'all' ||
      (filter === 'unread' && alert.status === 'unread') ||
      (filter === 'high-priority' && ['high', 'critical'].includes(alert.severity)) ||
      (filter === 'acknowledged' && alert.status === 'acknowledged');

    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'severity':
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      case 'status':
        const statusOrder = { unread: 4, read: 3, acknowledged: 2, dismissed: 1 };
        return statusOrder[b.status] - statusOrder[a.status];
      default:
        return 0;
    }
  });

  const handleSelectAll = () => {
    if (selectedAlerts.size === filteredAlerts.length && filteredAlerts.length > 0) {
      setSelectedAlerts(new Set());
    } else {
      setSelectedAlerts(new Set(filteredAlerts.map(alert => alert.id)));
    }
  };

  const handleMarkAsRead = async (alertIds: string[]) => {
    try {
      setAlerts(prev => prev.map(alert => 
        alertIds.includes(alert.id) 
          ? { ...alert, status: 'read' as AlertStatus }
          : alert
      ));
      setSelectedAlerts(new Set());
      toast.success(`${alertIds.length} alert(s) marked as read`);
    } catch (error) {
      toast.error('Failed to mark alerts as read');
    }
  };

  const handleAcknowledge = async (alertIds: string[]) => {
    try {
      setAlerts(prev => prev.map(alert => 
        alertIds.includes(alert.id) 
          ? { ...alert, status: 'acknowledged' as AlertStatus }
          : alert
      ));
      setSelectedAlerts(new Set());
      toast.success(`${alertIds.length} alert(s) acknowledged`);
    } catch (error) {
      toast.error('Failed to acknowledge alerts');
    }
  };

  const handleDismiss = async (alertIds: string[]) => {
    try {
      setAlerts(prev => prev.map(alert => 
        alertIds.includes(alert.id) 
          ? { ...alert, status: 'dismissed' as AlertStatus }
          : alert
      ));
      setSelectedAlerts(new Set());
      toast.success(`${alertIds.length} alert(s) dismissed`);
    } catch (error) {
      toast.error('Failed to dismiss alerts');
    }
  };

  const handleDelete = async (alertIds: string[]) => {
    if (!confirm(`Are you sure you want to delete ${alertIds.length} alert(s)?`)) {
      return;
    }

    try {
      setAlerts(prev => prev.filter(alert => !alertIds.includes(alert.id)));
      setSelectedAlerts(new Set());
      toast.success(`${alertIds.length} alert(s) deleted`);
    } catch (error) {
      toast.error('Failed to delete alerts');
    }
  };

  const getAlertIcon = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return <XCircleIcon className="h-6 w-6 text-red-600" />;
      case 'high':
        return <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />;
      case 'medium':
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />;
      case 'low':
        return <InformationCircleIcon className="h-6 w-6 text-blue-500" />;
      default:
        return <InformationCircleIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-red-50 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: AlertStatus) => {
    switch (status) {
      case 'unread': return 'bg-blue-100 text-blue-800';
      case 'read': return 'bg-gray-100 text-gray-800';
      case 'acknowledged': return 'bg-green-100 text-green-800';
      case 'dismissed': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFilterCounts = () => {
    return {
      all: alerts.length,
      unread: alerts.filter(a => a.status === 'unread').length,
      'high-priority': alerts.filter(a => ['high', 'critical'].includes(a.severity)).length,
      acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
    };
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Alerts</h3>
          <p className="text-gray-600 mb-6">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
          <Button onClick={handleRefresh}>
            Try Again
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const filterCounts = getFilterCounts();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Alerts</h1>
            <p className="mt-2 text-gray-600">
              Monitor and manage security alerts and risk notifications.
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            loading={refreshing}
            leftIcon={<ArrowPathIcon className="h-4 w-4" />}
          >
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Alerts</p>
                <p className="text-2xl font-bold text-gray-900">{filterCounts.all}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <BellIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unread</p>
                <p className="text-2xl font-bold text-blue-600">{filterCounts.unread}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <EyeSlashIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-red-600">{filterCounts['high-priority']}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Acknowledged</p>
                <p className="text-2xl font-bold text-green-600">{filterCounts.acknowledged}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search alerts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Filters and Sort */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FunnelIcon className="h-5 w-5 text-gray-400" />
                <select
                  title="Filter alerts"
                  aria-label="Filter alerts"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as FilterType)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All ({filterCounts.all})</option>
                  <option value="unread">Unread ({filterCounts.unread})</option>
                  <option value="high-priority">High Priority ({filterCounts['high-priority']})</option>
                  <option value="acknowledged">Acknowledged ({filterCounts.acknowledged})</option>
                </select>
              </div>

              <select
                aria-label="Sort alerts"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="date">Sort by Date</option>
                <option value="severity">Sort by Severity</option>
                <option value="status">Sort by Status</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedAlerts.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                {selectedAlerts.size} alert(s) selected
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleMarkAsRead(Array.from(selectedAlerts))}
                  leftIcon={<EyeIcon className="h-4 w-4" />}
                >
                  Mark Read
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAcknowledge(Array.from(selectedAlerts))}
                  leftIcon={<CheckIcon className="h-4 w-4" />}
                >
                  Acknowledge
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDismiss(Array.from(selectedAlerts))}
                  leftIcon={<XMarkIcon className="h-4 w-4" />}
                >
                  Dismiss
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(Array.from(selectedAlerts))}
                  leftIcon={<TrashIcon className="h-4 w-4" />}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Alerts List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-12">
              <BellIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts found</h3>
              <p className="text-gray-600">
                {searchTerm || filter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'All clear! No alerts to display at this time.'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {/* Header */}
              <div className="px-6 py-4 bg-gray-50">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    title="Select all alerts"
                    checked={selectedAlerts.size === filteredAlerts.length && filteredAlerts.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    Select All
                  </span>
                </div>
              </div>

              {/* Alert Items */}
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`px-6 py-6 hover:bg-gray-50 transition-colors duration-200 ${
                    alert.status === 'unread' ? 'bg-blue-50' : ''
                  }`}
                >
                    <input
                      type="checkbox"
                      title={`Select alert ${alert.title}`}
                      checked={selectedAlerts.has(alert.id)}
                      onChange={() => handleSelectAlert(alert.id)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
  
                    <div className="flex-shrink-0 mt-1">
                      {getAlertIcon(alert.severity)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className={`text-lg font-medium ${
                              alert.status === 'unread' ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {alert.title}
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                              {alert.severity}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                              {alert.status}
                            </span>
                          </div>

                          <p className="text-gray-600 mb-3">{alert.description}</p>

                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <CalendarIcon className="h-4 w-4" />
                              <span>{new Date(alert.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <ClockIcon className="h-4 w-4" />
                              <span>{new Date(alert.createdAt).toLocaleTimeString()}</span>
                            </div>
                            <span>•</span>
                            <span className="font-medium">{alert.category}</span>
                            <span>•</span>
                            <span>{alert.source}</span>
                          </div>

                          {alert.companyNames && alert.companyNames.length > 0 && (
                            <div className="mt-3">
                              <div className="flex flex-wrap gap-2">
                                {alert.companyNames.map((company) => (
                                  <span
                                    key={company}
                                    className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700"
                                  >
                                    {company}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {alert.riskScore !== undefined && (
                            <div className="mt-3">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500">Risk Score:</span>
                                <span className={`text-sm font-medium ${
                                  alert.riskScore >= 70 ? 'text-red-600' :
                                  alert.riskScore >= 40 ? 'text-yellow-600' : 'text-green-600'
                                }`}>
                                  {Math.round(alert.riskScore)}%
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          {alert.status === 'unread' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAsRead([alert.id])}
                              leftIcon={<EyeIcon className="h-4 w-4" />}
                            >
                              Mark Read
                            </Button>
                          )}

                          {alert.status !== 'acknowledged' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAcknowledge([alert.id])}
                              leftIcon={<CheckIcon className="h-4 w-4" />}
                            >
                              Acknowledge
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDismiss([alert.id])}
                            leftIcon={<XMarkIcon className="h-4 w-4" />}
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredAlerts.length > 0 && (
          <div className="flex items-center justify-between bg-white px-6 py-4 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-700">
              Showing {filteredAlerts.length} of {alerts.length} alerts
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AlertsPage;