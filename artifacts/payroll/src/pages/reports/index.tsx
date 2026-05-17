import { useState } from "react";
import { useGetMonthlyReport, getGetMonthlyReportQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatMonth } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText } from "lucide-react";
import P9Form from "@/components/p9-form";

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

function MonthlyReport() {
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);

  const { data: report, isLoading } = useGetMonthlyReport(
    { month, year },
    { query: { queryKey: getGetMonthlyReportQueryKey({ month, year }) } }
  );

  return (
    <div className="space-y-6">
      <Card className="bg-slate-50 dark:bg-slate-900/50 border-none shadow-none">
        <CardContent className="p-4 flex gap-4">
          <div className="space-y-1">
            <Label className="text-xs">Month</Label>
            <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
              <SelectTrigger className="w-[180px] bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <SelectItem key={m} value={m.toString()}>
                    {new Date(0, m - 1).toLocaleString('en-US', { month: 'long' })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Year</Label>
            <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
              <SelectTrigger className="w-[120px] bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : !report ? (
        <div className="text-center p-12 border rounded-lg bg-card text-muted-foreground flex flex-col items-center">
          <FileText className="h-10 w-10 mb-4 opacity-50" />
          <h3 className="font-semibold text-foreground">No Data Available</h3>
          <p className="text-sm mt-1">No payroll run was found for {formatMonth(month, year)}.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">KRA (PAYE)</CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="text-2xl font-bold">{formatCurrency(report.totalPaye)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">NSSF (Total)</CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="text-2xl font-bold">{formatCurrency(report.totalNssf)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">SHIF</CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="text-2xl font-bold">{formatCurrency(report.totalShif)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">Housing Levy</CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="text-2xl font-bold">{formatCurrency(report.totalHousingLevy)}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Department Cost Centers</CardTitle>
              <CardDescription>Gross pay breakdown by department</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(report.departmentSummary || []).map((dept, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                    <span className="font-medium">{dept.department || "Unassigned"}</span>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(dept.totalGross)}</div>
                      <div className="text-xs text-muted-foreground">{dept.employeeCount} employees</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">Detailed statutory and payroll reports including KRA P9 forms.</p>
      </div>

      <Tabs defaultValue="monthly">
        <TabsList className="mb-4">
          <TabsTrigger value="monthly">Monthly Summary</TabsTrigger>
          <TabsTrigger value="p9">P9 Forms</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly">
          <MonthlyReport />
        </TabsContent>

        <TabsContent value="p9">
          <P9Form />
        </TabsContent>
      </Tabs>
    </div>
  );
}
