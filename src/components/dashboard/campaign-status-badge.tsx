import { Badge } from "@/components/ui/badge";
import { CampaignStatus } from "@prisma/client";

const statusStyles: Record<CampaignStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SCHEDULED: "bg-blue-100 text-blue-700",
  SENDING: "bg-yellow-100 text-yellow-700",
  SENT: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export function CampaignStatusBadge({
  status,
}: {
  status: CampaignStatus;
}) {
  return (
    <Badge variant="secondary" className={statusStyles[status]}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  );
}
