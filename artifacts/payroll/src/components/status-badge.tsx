import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: string | undefined | null }) {
  if (!status) return null;

  const normalizedStatus = status.toLowerCase();

  switch (normalizedStatus) {
    case "approved":
    case "active":
    case "success":
      return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none px-2 py-0.5 font-medium">{status}</Badge>;
    case "processing":
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-none px-2 py-0.5 font-medium">{status}</Badge>;
    case "pending":
    case "draft":
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-none px-2 py-0.5 font-medium">{status}</Badge>;
    case "rejected":
    case "failed":
    case "terminated":
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-none px-2 py-0.5 font-medium">{status}</Badge>;
    case "disbursed":
      return <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-200 border-none px-2 py-0.5 font-medium">{status}</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
