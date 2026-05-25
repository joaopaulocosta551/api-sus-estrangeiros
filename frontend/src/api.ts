const API_URL = 'http://localhost:8081/api';
const authHeader = 'Basic ' + btoa('admin:admin123');

export const fetchAttendances = async () => {
    const response = await fetch(`${API_URL}/attendances`, {
        headers: {
            'Authorization': authHeader
        }
    });
    if (!response.ok) throw new Error('Failed to fetch data');
    return response.json();
};

export const importAttendances = async (maxRecords: number = 100) => {
    const response = await fetch(`${API_URL}/attendances/import?maxRecords=${maxRecords}`, {
        method: 'POST',
        headers: {
            'Authorization': authHeader
        }
    });
    if (!response.ok) throw new Error('Failed to import data');
    return response.text();
};
