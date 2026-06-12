import { Badge } from "@/components/ui/badge";
import type {
  PaymentStatus,
  PipelineStatus,
  ReleasePaymentStatus,
  ReleaseStatus,
  TaskPriority,
  TaskStatus
} from "@/lib/models";

type StatusBadgeProps = {
  status:
    | PipelineStatus
    | ReleaseStatus
    | PaymentStatus
    | ReleasePaymentStatus
    | TaskStatus
    | TaskPriority;
};

const statusMap: Record<string, "default" | "secondary" | "outline" | "success" | "warning" | "danger" | "info"> = {
  Bid: "info",
  Response: "warning",
  Intro: "info",
  Tech: "warning",
  Culture: "secondary",
  Final: "info",
  Offer: "success",
  Rejected: "danger",
  "not-ready": "outline",
  pending: "warning",
  approved: "success",
  released: "success",
  unbilled: "outline",
  paid: "success",
  todo: "outline",
  "in-progress": "info",
  review: "warning",
  done: "success",
  low: "outline",
  medium: "info",
  high: "warning",
  urgent: "danger"
};

const labelMap: Record<string, string> = {
  "not-ready": "Not ready",
  "in-progress": "In progress"
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant={statusMap[status] ?? "secondary"}>
      {labelMap[status] ?? status}
    </Badge>
  );
}
