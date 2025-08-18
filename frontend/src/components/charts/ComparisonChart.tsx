import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { useQuery } from '@tanstack/react-query';
import { fetchComparisonData } from '../../lib/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ComparisonChart: React.FC = () => {
    const { data, isLoading, error } = useQuery(['comparisonData'], fetchComparisonData);

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error loading data</div>;

    const chartData = {
        labels: data.map((item: any) => item.companyName),
        datasets: [
            {
                label: 'Risk Score',
                data: data.map((item: any) => item.riskScore),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
            },
        ],
    };

    return (
        <div>
            <h2>Comparison Chart</h2>
            <Bar data={chartData} options={{ responsive: true }} />
        </div>
    );
};

export default ComparisonChart;