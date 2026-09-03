import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { DashboardStatistics } from "@/lib/api-client"

function ChangeBadge({ change }: { change: number }) {
  const isPositive = change >= 0
  const Icon = isPositive ? IconTrendingUp : IconTrendingDown
  return (
    <Badge variant="outline">
      <Icon />
      {isPositive ? "+" : ""}
      {change}%
    </Badge>
  )
}

export function SectionCards({
  stats,
  isLoading,
}: {
  stats: DashboardStatistics | null
  isLoading: boolean
}) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Card key={i} className="@container/card">
            <CardHeader>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-2 h-8 w-16" />
            </CardHeader>
            <CardFooter>
              <Skeleton className="h-4 w-40" />
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total de Casos</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.totalCases.count.toLocaleString("es-CO")}
          </CardTitle>
          <CardAction>
            <ChangeBadge change={stats.totalCases.change} />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">
            {stats.totalCases.description}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Casos Pendientes</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.pendingCases.count.toLocaleString("es-CO")}
          </CardTitle>
          <CardAction>
            <ChangeBadge change={stats.pendingCases.change} />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">
            {stats.pendingCases.description}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Casos Finalizados</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.completedCases.count.toLocaleString("es-CO")}
          </CardTitle>
          <CardAction>
            <ChangeBadge change={stats.completedCases.change} />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">
            {stats.completedCases.description}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
