const API_URL = 'http://localhost:8081/api';
const authHeader = 'Basic ' + btoa('admin:admin123');

export interface PaginatedResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    number: number;
    size: number;
}

export interface DashboardStats {
    total: number;
    globalTotal: number;
    stateStats: { state: string; count: number }[];
    countryStats: { country: string; count: number }[];
    monthlyStats: { label: string; rawDate: string; count: number }[];
    availableStates: string[];
}

export const fetchAttendances = async (page: number = 0, size: number = 20, state?: string): Promise<PaginatedResponse<any>> => {
    const params = new URLSearchParams({
        page: String(page),
        size: String(size)
    });
    if (state && state !== 'all') {
        params.append('state', state);
    }

    const response = await fetch(`${API_URL}/attendances?${params.toString()}`, {
        headers: {
            'Authorization': authHeader
        }
    });
    if (!response.ok) throw new Error('Failed to fetch paginated data');
    return response.json();
};

export const fetchDashboardStats = async (state?: string): Promise<DashboardStats> => {
    const params = new URLSearchParams();
    if (state && state !== 'all') {
        params.append('state', state);
    }

    const response = await fetch(`${API_URL}/attendances/stats?${params.toString()}`, {
        headers: {
            'Authorization': authHeader
        }
    });
    if (!response.ok) throw new Error('Failed to fetch dashboard stats');
    return response.json();
};

export const importAttendances = async (maxRecords: number = 100): Promise<string> => {
    const response = await fetch(`${API_URL}/attendances/import?maxRecords=${maxRecords}`, {
        method: 'POST',
        headers: {
            'Authorization': authHeader
        }
    });
    if (!response.ok) throw new Error('Failed to import data');
    return response.text();
};

export const fetchImportStatus = async (): Promise<{ isImporting: boolean }> => {
    const response = await fetch(`${API_URL}/attendances/import/status`, {
        headers: {
            'Authorization': authHeader
        }
    });
    if (!response.ok) throw new Error('Failed to fetch import status');
    return response.json();
};
