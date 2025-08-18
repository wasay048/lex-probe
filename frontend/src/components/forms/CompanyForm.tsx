import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSearch } from '../../hooks/useSearch';
import { RiskIndicator } from '../../types/search';

const CompanyForm: React.FC = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const { searchCompanies } = useSearch();
    const [companyCount, setCompanyCount] = useState(2);
    const [riskIndicators, setRiskIndicators] = useState<RiskIndicator[]>([]);

    const onSubmit = async (data: any) => {
        const { companyNames, searchFilters } = data;
        await searchCompanies(companyNames, searchFilters, riskIndicators);
    };

    const addCompanyField = () => {
        setCompanyCount(prevCount => prevCount + 1);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <h2>Company Search</h2>
            {[...Array(companyCount)].map((_, index) => (
                <div key={index}>
                    <input
                        type="text"
                        placeholder={`Company Name ${index + 1}`}
                        {...register(`companyNames[${index}]`, { required: true })}
                    />
                    {errors.companyNames && <span>This field is required</span>}
                </div>
            ))}
            <button type="button" onClick={addCompanyField}>Add Another Company</button>

            <div>
                <label htmlFor="searchFilters">Search Filters:</label>
                <select {...register('searchFilters')}>
                    <option value="industry">Industry</option>
                    <option value="date">Date</option>
                </select>
            </div>

            <div>
                <label htmlFor="riskIndicators">Select Risk Indicators:</label>
                <select multiple {...register('riskIndicators')} onChange={(e) => setRiskIndicators(Array.from(e.target.selectedOptions, option => option.value))}>
                    {/* Map through risk indicators here */}
                </select>
            </div>

            <button type="submit">Search</button>
        </form>
    );
};

export default CompanyForm;