import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSearchResults } from '../lib/api';
import { SearchResult } from '../types/search';

const useSearch = () => {
  const [searchParams, setSearchParams] = useState<{ companies: string[]; filters: any }>({
    companies: [],
    filters: {},
  });

  const { data, isLoading, error } = useQuery<SearchResult[], Error>(
    ['searchResults', searchParams],
    () => fetchSearchResults(searchParams),
    {
      enabled: searchParams.companies.length > 1, // Only run query if at least two companies are provided
    }
  );

  const updateSearchParams = (newParams: { companies?: string[]; filters?: any }) => {
    setSearchParams((prev) => ({
      ...prev,
      ...newParams,
    }));
  };

  return {
    searchParams,
    updateSearchParams,
    data,
    isLoading,
    error,
  };
};

export default useSearch;