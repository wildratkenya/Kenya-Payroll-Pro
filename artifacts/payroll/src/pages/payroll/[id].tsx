import { useParams } from "wouter";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetPayrollRun, 
  getGetPayrollRunQueryKey,
  useListPayrollEntries,
  getListPayrollEntriesQueryKey,
  useApprovePayrollRun,
  useDisbursePayrollRun
} from "@workspace/api-client-react";
import { ArrowLeft, CheckCircle2, DollarSign, Download, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency, formatMonth } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";

export default function PayrollRunDetail() {
  const { id } = useParams();
  const runId = parseInt(id || "0", 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: run, isLoading: runLoading } = useGetPayrollRun(runId, {
    query: { queryKey: getGetPayrollRunQueryKey(runId), enabled: !!runId }
  });

  const { data: entries = [], isLoading: entriesLoading } = useListPayrollEntries(runId, {
    query: { queryKey: getListPayrollEntriesQueryKey(runId), enabled: !!runId }
  });

  const approveMutation = useApprovePayrollRun();
  const disburseMutation = useDisbursePayrollRun();

  if (runLoading) {
    return <div className="space-y-6"><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!run) {
    return <div>Payroll run not found.</div>;
  }

  const handleApprove = () => {
    approveMutation.mutate(
      { id: runId, data: {} },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetPayrollRunQueryKey(runId) });
          toast({ title: "Approved", description: "Payroll run approved successfully." });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to approve payroll run.", variant: "destructive" });
        }
      }
    );
  };

  const handleDisburse = () => {
    disburseMutation.mutate(
      { id: runId, data: {} },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetPayrollRunQueryKey(runId) });
          queryClient.invalidateQueries({ queryKey: getListPayrollEntriesQueryKey(runId) });
          toast({ title: "Disbursement Started", description: "Payments are now processing via M-Pesa and banks." });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to start disbursement.", variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/payroll">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {formatMonth(run.month, run.year)} Payroll
              </h1>
              <StatusBadge status={run.status} />
            </div>
            <p className="text-muted-foreground text-sm">ID: #{run.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {run.status === "processing" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700" disabled={approveMutation.isPending}>
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Approve Run
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Approve Payroll Run?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will finalize the calculations. Once approved, the payroll run cannot be modified and is ready for disbursement.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleApprove} className="bg-green-600 hover:bg-green-700">Approve</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {run.status === "approved" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90" disabled={disburseMutation.isPending}>
                  <DollarSign className="w-4 h-4 mr-2" /> Disburse Funds
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Disburse {formatCurrency(run.totalNet)}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will immediately queue payouts to {run.employeeCount} employees via their preferred payment methods (M-Pesa / Bank).
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDisburse}>Confirm Disbursement</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-50 dark:bg-slate-900/50">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" /> Employees
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-2xl font-bold">{run.employeeCount || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-50 dark:bg-slate-900/50">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Gross</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-2xl font-bold">{formatCurrency(run.totalGross)}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-50 dark:bg-slate-900/50 border-red-200 dark:border-red-900/50">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400">Total Taxes & Deductions</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency((run.totalPaye || 0) + (run.totalNssf || 0) + (run.totalShif || 0) + (run.totalHousingLevy || 0))}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-primary">Total Net Payout</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-2xl font-bold text-primary">{formatCurrency(run.totalNet)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Employee Payslips</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Detailed breakdown for each employee in this run.</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 whitespace-nowrap">
                  <TableHead>Employee</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">PAYE</TableHead>
                  <TableHead className="text-right">NSSF</TableHead>
                  <TableHead className="text-right">SHIF</TableHead>
                  <TableHead className="text-right">Levy</TableHead>
                  <TableHead className="text-right">Relief</TableHead>
                  <TableHead className="text-right font-bold text-primary">Net Pay</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entriesLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">Loading entries...</TableCell>
                  </TableRow>
                ) : entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">No entries found for this run.</TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry) => (
                    <TableRow key={entry.id} className="whitespace-nowrap">
                      <TableCell>
                        <Link href={`/employees/${entry.employeeId}`} className="font-medium hover:underline">
                          {entry.employeeName}
                        </Link>
                        <div className="text-xs text-muted-foreground">{entry.employeeNumber}</div>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(entry.grossSalary)}</TableCell>
                      <TableCell className="text-right text-red-600/80">-{formatCurrency(entry.paye)}</TableCell>
                      <TableCell className="text-right text-red-600/80">-{formatCurrency(entry.nssfEmployee)}</TableCell>
                      <TableCell className="text-right text-red-600/80">-{formatCurrency(entry.shif)}</TableCell>
                      <TableCell className="text-right text-red-600/80">-{formatCurrency(entry.housingLevyEmployee)}</TableCell>
                      <TableCell className="text-right text-green-600/80">+{formatCurrency(entry.personalRelief)}</TableCell>
                      <TableCell className="text-right font-bold text-primary">{formatCurrency(entry.netPay)}</TableCell>
                      <TableCell>
                        <span className="capitalize text-xs font-medium px-2 py-1 bg-slate-100 rounded-md border">
                          {entry.paymentMethod}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={entry.disbursementStatus || "pending"} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
