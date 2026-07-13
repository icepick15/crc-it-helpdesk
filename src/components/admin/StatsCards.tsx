'use client';

import { FileText, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AdminStats } from '@/lib/types';

interface StatsCardsProps {
  stats: AdminStats;
  loading?: boolean;
}

export function StatsCards({ stats, loading }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Issues',
      value: stats.total,
      icon: FileText,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'Completed',
      value: stats.completed,
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:gap-6">
      {cards.map((card) => (
        <Card key={card.title} className="py-3 gap-2 sm:py-6 sm:gap-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 sm:pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
              {card.title}
            </CardTitle>
            <div className={`hidden sm:block p-2 rounded-lg ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className={`text-2xl sm:text-3xl font-bold ${loading ? 'animate-pulse' : ''}`}>
              {loading ? '-' : card.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
