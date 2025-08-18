import { useQuery } from '@tanstack/react-query';

// Mock API function - replace with actual API call
const fetchAlerts = async () => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock alerts data
  return [
    {
      id: '1',
      title: 'High-Risk Cartel Activity Detected',
      description: 'Suspicious pricing patterns detected among tech companies in the mobile device market.',
      type: 'risk_detection',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      title: 'Market Analysis Complete',
      description: 'Your analysis of pharmaceutical companies has been completed with medium risk indicators.',
      type: 'analysis_complete',
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      title: 'System Maintenance Scheduled',
      description: 'Scheduled maintenance will occur tonight from 2:00 AM to 4:00 AM UTC.',
      type: 'system_alert',
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
      updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '4',
      title: 'New Compliance Regulation',
      description: 'Updated antitrust regulations now available in the compliance section.',
      type: 'compliance',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '5',
      title: 'Critical Alert: Price Fixing Indicators',
      description: 'Multiple indicators suggest potential price fixing in the automotive industry.',
      type: 'critical_risk',
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
  ];
};

export const useAlerts = () => {
  const {
    data: alerts = [],
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['alerts'],
    queryFn: fetchAlerts,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
  });

  return {
    alerts,
    error,
    isLoading,
    refetch,
  };
};