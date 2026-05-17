import { useQuery } from "@tanstack/react-query";
import { 
  Users, 
  Banknote, 
  CalendarClock, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight
} from "lucide-react";
import { 
  useGetPayrollSummary, 
  getGetPayrollSummaryQueryKey 
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";

export default function Dashboard() {
  const { data: summary, isLoading } = useGetPayrollSummary({
    query: { queryKey: getGetPayrollSummaryQueryKey() }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your payroll and HR metrics.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-7 w-20" /> : (
              <>
                <div className="text-2xl font-bold">{summary?.activeEmployees}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Active out of {summary?.totalEmployees} total
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Month Gross</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-7 w-32" /> : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(summary?.currentMonthGross)}</div>
                <div className="flex items-center text-xs mt-1 text-muted-foreground">
                  Net: {formatCurrency(summary?.currentMonthNet)}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Statutory Deductions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-7 w-32" /> : (
              <>
                <div className="text-2xl font-bold">{formatCurrency((summary?.currentMonthPaye || 0) + (summary?.currentMonthNssf || 0) + (summary?.currentMonthShif || 0) + (summary?.currentMonthHousingLevy || 0))}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  PAYE, NSSF, SHIF & Levy
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Leave</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-7 w-16" /> : (
              <>
                <div className="text-2xl font-bold">{summary?.pendingLeaveRequests || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Requires approval
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Payroll Trend</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            {isLoading ? <Skeleton className="h-[300px] w-full" /> : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary?.monthlyTrend || []} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} tickMargin={10} />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      fontSize={12} 
                      tickFormatter={(val) => `KSh ${val / 1000}k`} 
                      width={80}
                    />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), ""]}
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend iconType="circle" />
                    <Bar dataKey="gross" name="Gross Pay" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="net" name="Net Pay" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Department Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[300px] w-full" /> : (
              <div className="space-y-6">
                {(summary?.departmentBreakdown || []).map((dept, i) => (
                  <div key={i} className="flex items-center">
                    <div className="ml-4 space-y-1 w-full">
                      <div className="flex items-center justify-between w-full">
                        <p className="text-sm font-medium leading-none">{dept.department || "Unassigned"}</p>
                        <p className="text-sm font-medium">{formatCurrency(dept.totalGross)}</p>
                      </div>
                      <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                        <span>{dept.employeeCount} Employees</span>
                      </div>
                    </div>
                  </div>
                ))}
                {(!summary?.departmentBreakdown || summary.departmentBreakdown.length === 0) && (
                  <div className="text-center text-muted-foreground py-8">
                    No department data available
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
