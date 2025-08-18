import React from "react";
import { useQuery } from "@tanstack/react-query";
import fetchDashboardData from "../../lib/api";
import RiskChart from "../charts/RiskChart";
import ComparisonChart from "../charts/ComparisonChart";

const Dashboard: React.FC = () => {
  const { data, error, isLoading } = useQuery({
    queryKey: ["dashboardData"],
    queryFn: fetchDashboardData,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading dashboard data</div>;

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <div className="charts">
        <RiskChart />
        <ComparisonChart />
      </div>
    </div>
  );
};

export default Dashboard;
