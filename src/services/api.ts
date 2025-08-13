import { apiClient } from '@/lib/api-client';
import { 
  LoginRequest, 
  LoginResponse, 
  OAuthStatus,
  DashboardStatistics, 
  ChartDataPoint, 
  CasesResponse, 
  CasesQueryParams,
  ChartPeriod 
} from '@/types/api';

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>('/auth/login', credentials);
  },

  // Verificar estado de OAuth
  async checkOAuthStatus(): Promise<OAuthStatus> {
    return apiClient.get<OAuthStatus>('/oauth/status');
  },
};

export const dashboardService = {
  async getStatistics(): Promise<DashboardStatistics> {
    return apiClient.get<DashboardStatistics>('/dashboard/statistics');
  },

  async getChartData(period: ChartPeriod = '3m'): Promise<ChartDataPoint[]> {
    return apiClient.get<ChartDataPoint[]>(`/dashboard/chart-data?period=${period}`);
  },
};

export const casesService = {
  async getCases(params: CasesQueryParams = {}): Promise<CasesResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.status) searchParams.append('status', params.status);
    if (params.search) searchParams.append('search', params.search);

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/cases?${queryString}` : '/cases';
    
    return apiClient.get<CasesResponse>(endpoint);
  },
};
