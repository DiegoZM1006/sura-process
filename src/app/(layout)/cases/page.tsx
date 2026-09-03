"use client"

import { useEffect, useState } from "react"
import { DataTable, schema } from "@/components/data-table"
import { getCases, type Case, ApiError } from "@/lib/api-client"
import { z } from "zod"

const MS_PER_DAY = 1000 * 60 * 60 * 24
const ABOUT_TO_EXPIRE_THRESHOLD_DAYS = 5

/**
 * El backend maneja el estado real del caso (PENDIENTE | EN_PROCESO | CONTESTADO).
 * La tabla del frontend fue diseñada con otra taxonomía (a tiempo / próximo a
 * vencer / vencido / finalizado), así que la derivamos combinando el estado
 * real con la fecha límite (`deadline`).
 */
function deriveDisplayStatus(item: Case): string {
  if (item.status === "CONTESTADO") return "FINISHED"

  const daysLeft = (new Date(item.deadline).getTime() - Date.now()) / MS_PER_DAY
  if (daysLeft < 0) return "EXPIRED"
  if (daysLeft <= ABOUT_TO_EXPIRE_THRESHOLD_DAYS) return "ABOUT_TO_EXPIRE"
  return "ON_TIME"
}

function mapCaseToRow(item: Case): z.infer<typeof schema> {
  return {
    id: item.id,
    numberCase: item.userCaseId,
    involved: item.companyName,
    notificationDate: item.sentAt,
    // El backend aún no registra una cuantía por caso; se muestra en 0
    // hasta que ese campo exista en el modelo de datos.
    amount: "0",
    status: deriveDisplayStatus(item),
  }
}

export default function Page() {
  const [data, setData] = useState<z.infer<typeof schema>[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getCases({ limit: 200 })
      .then((result) => setData(result.cases.map(mapCaseToRow)))
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
          {isLoading ? (
            <div className="px-4 text-sm text-muted-foreground lg:px-6">
              Cargando casos...
            </div>
          ) : (
            <DataTable data={data} />
          )}
        </div>
      </div>
    </div>
  )
}
