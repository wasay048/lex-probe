import { useQuery } from "@tanstack/react-query";
import { Project } from "../types/project";
import fetchProjects from "../lib/api";

const useProjects = () => {
  const { data, error, isLoading } = useQuery<Project[], Error>({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });

  return {
    projects: data,
    isLoading,
    error,
  };
};

export default useProjects;
