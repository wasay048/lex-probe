import React from "react";
import { useQuery } from "@tanstack/react-query";
import fetchRiskData from "../../lib/api";

interface RiskData {
  // Define your risk data structure here
  indicators: Array<{
    name: string;
    value: number;
    threshold: number;
  }>;
}

const RiskChart: React.FC = () => {
  const { data, error, isLoading } = useQuery<RiskData, Error>({
    queryKey: ["riskData"],
    queryFn: fetchRiskData,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Risk Indicators</h2>
      <canvas id="riskChart" />
      {/* Chart rendering logic will go here */}
    </div>
  );
};

export default RiskChart;
