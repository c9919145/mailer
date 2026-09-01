"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/analytics/metric-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AnalyticsData {
  series: {
    date: string;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
  }[];
  totals: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    failed: number;
  };
  rates: {
    openRate: number;
    clickRate: number;
    bounceRate: number;
  };
  campaigns: {
    id: string;
    name: string;
    templateName: string;
    status: string;
    total: number;
    opened: number;
    clicked: number;
    openRate: number;
    clickRate: number;
    createdAt: string;
  }[];
}

const PIE_COLORS = ["#22c55e", "#3b82f6", "#a855f7", "#ef4444", "#f59e0b"];

export function AnalyticsClient() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [days, setDays] = useState("30");
  const [loading, setLoading] = useState(true);

  async function loadData(daysParam: string) {
    setLoading(true);
    const res = await fetch(`/api/analytics?days=${daysParam}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }

  useEffect(() => {
    loadData(days);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const pieData = data
    ? [
        {
          name: "Delivered",
          value:
            data.totals.delivered -
            data.totals.opened -
            data.totals.clicked,
        },
        { name: "Opened", value: data.totals.opened },
        { name: "Clicked", value: data.totals.clicked },
        { name: "Bounced", value: data.totals.bounced },
        { name: "Failed", value: data.totals.failed },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Track the performance of your email campaigns."
        actions={
          <Select value={days} onValueChange={(v) => setDays(v ?? "30")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {loading || !data ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard
              label="Open rate"
              value={`${data.rates.openRate.toFixed(1)}%`}
              accent="text-blue-500"
            />
            <MetricCard
              label="Click rate"
              value={`${data.rates.clickRate.toFixed(1)}%`}
              accent="text-purple-500"
            />
            <MetricCard
              label="Bounce rate"
              value={`${data.rates.bounceRate.toFixed(1)}%`}
              accent="text-red-500"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Emails over time</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.series}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="sent"
                    stroke="#22c55e"
                    name="Sent"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="opened"
                    stroke="#3b82f6"
                    name="Opened"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="clicked"
                    stroke="#a855f7"
                    name="Clicked"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Engagement breakdown</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Campaign performance</CardTitle>
              </CardHeader>
              <CardContent>
                {data.campaigns.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    No campaign data yet.
                  </p>
                ) : (
                  <div className="max-h-[300px] space-y-3 overflow-auto">
                    {data.campaigns.map((campaign) => (
                      <div
                        key={campaign.id}
                        className="rounded-lg border p-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {campaign.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {campaign.total} sent
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <span>
                            {campaign.opened} opened ({campaign.openRate.toFixed(0)}%)
                          </span>
                          <span>
                            {campaign.clicked} clicked ({campaign.clickRate.toFixed(0)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
