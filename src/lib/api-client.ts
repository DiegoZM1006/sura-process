/**
 * Cliente para la API del backend (btl-sura-backend).
 *
 * Base URL configurable vía NEXT_PUBLIC_API_URL (ver /ENV_VARS.md en la raíz
 * del repo). Por defecto apunta al backend en desarrollo local.
 */
import { clearSession, getAccessToken, type AuthUser } from "./auth"

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken()

  const headers = new Headers(options.headers)
  headers.set("Content-Type", "application/json")
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    // Token ausente/expirado/inválido: cerrar sesión local y forzar login.
    clearSession()
    if (typeof window !== "undefined") {
      window.location.href = "/"
    }
    throw new ApiError("Sesión expirada, inicia sesión nuevamente", 401)
  }

  const text = await response.text()
  const body = text ? JSON.parse(text) : null

  if (!response.ok) {
    const message = Array.isArray(body?.message)
      ? body.message.join(", ")
      : body?.message || "Error al comunicarse con el servidor"
    throw new ApiError(message, response.status)
  }

  return body as T
}

// ---------- Auth ----------

export interface LoginResponse {
  accessToken: string
  user: AuthUser
}

export function login(email: string, password: string) {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

// ---------- Dashboard ----------

export interface DashboardStatMetric {
  count: number
  change: number
  description: string
}

export interface DashboardStatistics {
  totalCases: DashboardStatMetric
  pendingCases: DashboardStatMetric
  completedCases: DashboardStatMetric
  inProcessCases: Omit<DashboardStatMetric, "change">
}

export function getDashboardStatistics() {
  return apiFetch<DashboardStatistics>("/dashboard/statistics")
}

export type ChartPeriod = "7d" | "30d" | "3m"

export interface ChartDataPoint {
  date: string
  total: number
  pending: number
  completed: number
  inProcess: number
}

export function getDashboardChartData(period: ChartPeriod = "3m") {
  return apiFetch<ChartDataPoint[]>(`/dashboard/chart-data?period=${period}`)
}

// ---------- Cases ----------

export type CaseStatus = "PENDIENTE" | "EN_PROCESO" | "CONTESTADO"

export interface Case {
  id: string
  userId: string
  type: string
  companyName: string
  userCaseId: string
  messageId: string
  status: CaseStatus
  sentAt: string
  deadline: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    email: string
    fullName?: string
    phone?: string
  }
}

export interface PaginatedCases {
  cases: Case[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface GetCasesParams {
  page?: number
  limit?: number
  status?: CaseStatus
  search?: string
}

export function getCases(params: GetCasesParams = {}) {
  const query = new URLSearchParams()
  query.set("page", String(params.page ?? 1))
  query.set("limit", String(params.limit ?? 100))
  if (params.status) query.set("status", params.status)
  if (params.search) query.set("search", params.search)

  return apiFetch<PaginatedCases>(`/cases?${query.toString()}`)
}

export interface CreateCaseInput {
  type: string
  companyName: string
  messageId: string
}

export function createCase(input: CreateCaseInput) {
  return apiFetch<Case>("/cases", {
    method: "POST",
    body: JSON.stringify(input),
  })
}
