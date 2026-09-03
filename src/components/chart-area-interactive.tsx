"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { getDashboardChartData, type ChartDataPoint, type ChartPeriod } from "@/lib/api-client"

export const description = "An interactive area chart"

const chartConfig = {
  pending: {
    label: "Pendientes",
    color: "var(--primary)",
  },
  completed: {
    label: "Finalizados",
    color: "var(--primary)",
  },
} satisfies ChartConfig

// Mapeo entre el selector visible (90d/30d/7d) y el parámetro `period`
// que espera el endpoint GET /dashboard/chart-data del backend.
const TIME_RANGE_TO_PERIOD: Record<string, ChartPeriod> = {
  "90d": "3m",
  "30d": "30d",
  "7d": "7d",
}

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")
  const [chartData, setChartData] = React.useState<ChartDataPoint[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  React.useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    getDashboardChartData(TIME_RANGE_TO_PERIOD[timeRange])
      .then((data) => {
        if (!cancelled) setChartData(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error al cargar el gráfico")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [timeRange])

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Total casos</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Total de casos en el periodo seleccionado
          </span>
          <span className="@[540px]/card:hidden">Casos</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(value) => value && setTimeRange(value)}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Ultimos 3 meses</ToggleGroupItem>
            <ToggleGroupItem value="30d">Ultimos 30 dias</ToggleGroupItem>
            <ToggleGroupItem value="7d">Ultimos 7 dias</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {error ? (
          <div className="flex h-[250px] items-center justify-center text-sm text-red-600">
            {error}
          </div>
        ) : isLoading ? (
          <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
            Cargando datos...
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="fillPending" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-pending)"
                    stopOpacity={1.0}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-pending)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-completed)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-completed)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString("es-CO", {
                    month: "short",
                    day: "numeric",
                  })
                }}
              />
              <ChartTooltip
                cursor={false}
                defaultIndex={isMobile ? -1 : Math.min(10, chartData.length - 1)}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value as string).toLocaleDateString("es-CO", {
                        month: "short",
                        day: "numeric",
                      })
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="completed"
                type="natural"
                fill="url(#fillCompleted)"
                stroke="var(--color-completed)"
                stackId="a"
              />
              <Area
                dataKey="pending"
                type="natural"
                fill="url(#fillPending)"
                stroke="var(--color-pending)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
