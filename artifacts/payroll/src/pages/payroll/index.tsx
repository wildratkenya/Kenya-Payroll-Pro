import { useState } from "react";
import { Link } from "wouter";
import { Plus, Search, Calendar as CalendarIcon, FileSpreadsheet } from "lucide-react";
import { 
  useListPayrollRuns, 
  getListPayrollRunsQueryKey 
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatMonth, formatDate } from "@/lib/format";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";

export default function PayrollRunsList() {
  const { data: runs = [], isLoading } = useListPayrollRuns({ 
    query: { queryKey: getListPayrollRunsQueryKey() } 
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payroll Runs</h1>
          <p className="text-muted-foreground">Manage monthly payroll processing and disbursements.</p>
        </div>
        <Link href="/payroll/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" /> New Payroll Run
          </Button>
        </Link>
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Period</TableHead>
              <TableHead>Employees</TableHead>
              <TableHead className="text-right">Total Gross</TableHead>
              <TableHead className="text-right">Total Net</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Loading payroll runs...
                </TableCell>
              </TableRow>
            ) : runs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center">
                    <FileSpreadsheet className="h-8 w-8 mb-2 text-slate-300" />
                    <p>No payroll runs found.</p>
                    <Link href="/payroll/new">
                      <Button variant="link" className="mt-2">Create your first run</Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              runs.map((run) => (
                <TableRow key={run.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <Link href={`/payroll/${run.id}`} className="block font-medium">
                      {formatMonth(run.month, run.year)}
                    </Link>
                  </TableCell>
                  <TableCell>{run.employeeCount || 0}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(run.totalGross)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-primary">
                    {formatCurrency(run.totalNet)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(run.createdAt)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={run.status} />
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
