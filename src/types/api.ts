// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
  };
}

// OAuth types
export interface OAuthStatus {
  isAuthorized: boolean;
  message: string;
}

// Dashboard types
export interface StatisticItem {
  count: number;
  change: number;
  description: string;
}

export interface DashboardStatistics {
  totalCases: StatisticItem;
  pendingCases: StatisticItem;
  completedCases: StatisticItem;
  inProcessCases: {
    count: number;
    description: string;
  };
}

export interface ChartDataPoint {
  date: string;
  total: number;
  pending: number;
  completed: number;
  inProcess: number;
}

// Cases types
export type CaseStatus = 'PENDIENTE' | 'EN_PROCESO' | 'CONTESTADO';
export type CaseType = 'CONSULTA' | 'RECLAMO' | 'DENUNCIA';

export interface User {
  id: string;
  email: string;
}

export interface Case {
  id: string;
  userCaseId: string;
  type: CaseType;
  companyName: string;
  messageId: string;
  sentAt: string;
  deadline: string;
  status: CaseStatus;
  createdAt: string;
  user: User;
}

export interface CasesResponse {
  cases: Case[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CasesQueryParams {
  page?: number;
  limit?: number;
  status?: CaseStatus;
  search?: string;
}

export type ChartPeriod = '7d' | '30d' | '3m';
