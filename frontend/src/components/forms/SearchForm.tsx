import React, { useState } from 'react';
import useSearch from '../../hooks/useSearch';
import Input from '../ui/Input';
import Button from '../ui/Button';

const SearchForm: React.FC = () => {
    const [companyName, setCompanyName] = useState('');
    const [website, setWebsite] = useState('');
    const [filters, setFilters] = useState({ industry: '', date: '' });
    const { updateSearchParams } = useSearch();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (companyName && website) {
            updateSearchParams({ companies: [companyName], filters });
        }
    };

    return (
        <form onSubmit={handleSearch} className="search-form">
            <div>
                <Input
                    type="text"
                    placeholder="Company Name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                />
            </div>
            <div>
                <Input
                    type="text"
                    placeholder="Website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                />
            </div>
            <div>
                <Input
                    type="text"
                    placeholder="Industry"
                    value={filters.industry}
                    onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
                />
            </div>
            <div>
                <Input
                    type="date"
                    value={filters.date}
                    onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                />
            </div>
            <Button type="submit">Search</Button>
        </form>
    );
};

export default SearchForm;