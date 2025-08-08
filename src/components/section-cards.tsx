"use client";

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
import { useEffect, useState } from "react";
import { dashboardService } from "@/services/api";
import { DashboardStatistics } from "@/types/api";
import { useToast } from "@/hooks/use-toast";

export function SectionCards() {
  const [statistics, setStatistics] = useState<DashboardStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const { showError } = useToast();

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const data = await dashboardService.getStatistics();
        setStatistics(data);
      } catch (error) {
        console.error("Error fetching statistics:", error);
        showError("Error al cargar las estadísticas");
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [showError]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
        {[1, 2, 3].map((index) => (
          <Card key={index} className="@container/card animate-pulse">
            <CardHeader>
              <CardDescription className="bg-gray-300 h-4 w-24 rounded"></CardDescription>
              <CardTitle className="bg-gray-300 h-8 w-16 rounded"></CardTitle>
            </CardHeader>
            <CardFooter>
              <div className="bg-gray-300 h-4 w-32 rounded"></div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (!statistics) {
    return null;
  }

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total de Casos</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {statistics.totalCases.count}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {statistics.totalCases.change >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
              +{statistics.totalCases.change}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Incremento este período <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {statistics.totalCases.description}
          </div>
        </CardFooter>
      </Card>
      
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Casos Pendientes</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {statistics.pendingCases.count}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {statistics.pendingCases.change >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
              +{statistics.pendingCases.change}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Incremento este período <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {statistics.pendingCases.description}
          </div>
        </CardFooter>
      </Card>
      
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Casos Finalizados</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {statistics.completedCases.count}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {statistics.completedCases.change >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
              +{statistics.completedCases.change}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Alta tasa de resolución <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">{statistics.completedCases.description}</div>
        </CardFooter>
      </Card>
    </div>
  )
}
