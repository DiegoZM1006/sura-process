"use client"

import { useEffect, useState } from "react"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { SectionCards } from "@/components/section-cards"
import { getDashboardStatistics, type DashboardStatistics, ApiError } from "@/lib/api-client"

export default function Page() {
  const [stats, setStats] = useState<DashboardStatistics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getDashboardStatistics()
      .then(setStats)
      .catch((err) => {
        setError(
          err instanceof ApiError
            ? err.message
            : "No se pudo conectar con el backend"
        )
      })
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {error && (
            <div className="mx-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 lg:mx-6">
              {error}
            </div>
          )}
          <SectionCards stats={stats} isLoading={isLoading} />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive />
          </div>
        </div>
      </div>
    </div>
  )
}
