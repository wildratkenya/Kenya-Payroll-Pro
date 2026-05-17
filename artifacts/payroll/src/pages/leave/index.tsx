import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListLeaveRequests, 
  getListLeaveRequestsQueryKey,
  useUpdateLeaveRequest
} from "@workspace/api-client-react";
import { Check, X, Calendar as CalendarIcon, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function LeaveRequestsList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  const { data: requests = [], isLoading } = useListLeaveRequests(
    filter === "pending" ? { status: "pending" } : undefined,
    { query: { queryKey: getListLeaveRequestsQueryKey(filter === "pending" ? { status: "pending" } : undefined) } }
  );

  const updateLeave = useUpdateLeaveRequest();

  const handleAction = (id: number, status: "approved" | "rejected") => {
    updateLeave.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListLeaveRequestsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListLeaveRequestsQueryKey({ status: "pending" }) });
          toast({
            title: `Request ${status}`,
            description: `The leave request has been ${status}.`,
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to update the leave request.",
            variant: "destructive",
          });
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leave Requests</h1>
          <p className="text-muted-foreground">Review and manage employee time off.</p>
        </div>
        <div className="flex bg-muted p-1 rounded-md">
          <Button 
            variant={filter === "pending" ? "default" : "ghost"} 
            size="sm" 
            onClick={() => setFilter("pending")}
          >
            Pending Only
          </Button>
          <Button 
            variant={filter === "all" ? "default" : "ghost"} 
            size="sm" 
            onClick={() => setFilter("all")}
          >
            All Requests
          </Button>
        </div>
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <Skeleton className="h-4 w-1/2 mx-auto" />
                </TableCell>
              </TableRow>
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  No {filter === "pending" ? "pending " : ""}leave requests found.
                </TableCell>
              </TableRow>
            ) : (
              requests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">{req.employeeName}</TableCell>
                  <TableCell>{req.leaveTypeName}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {formatDate(req.startDate)} - {formatDate(req.endDate)}
                  </TableCell>
                  <TableCell>{req.days}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={req.reason || ""}>
                    {req.reason || "-"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={req.status} />
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {req.status === "pending" && (
                      <>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleAction(req.id, "rejected")}
                          disabled={updateLeave.isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="h-8 w-8 text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => handleAction(req.id, "approved")}
                          disabled={updateLeave.isPending}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
