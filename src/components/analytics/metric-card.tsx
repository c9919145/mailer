import { Card, CardContent } from "@/components/ui/card";

interface MetricCardProps {
  label: string;
  value: string;
  accent?: string;
}

export function MetricCard({ label, value, accent }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`mt-2 text-3xl font-bold ${accent || ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
