export interface Project {
    _id: string;
    id: string;
    userId: string;
    name: string;
    description?: string;
    searchIds: string[];
    searches?: any[]; // Populated searches if needed
    tags: string[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    sharedWith?: Array<{
        userId: string;
        permission: "read" | "write" | "admin";
        sharedAt: string;
    }>;
}

export interface CreateProjectInput {
    name: string;
    description: string;
    riskIndicators: string[];
}

export interface UpdateProjectInput {
    name?: string;
    description?: string;
    riskIndicators?: string[];
    status?: 'active' | 'inactive';
}