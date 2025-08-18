import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchRiskData } from '../../lib/api';
import { RiskData } from '../../types/api';

const RiskChart: React.FC = () => {
    const { data, error, isLoading } = useQuery<RiskData, Error>('riskData', fetchRiskData);

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