import { useParams } from "wouter";
import { Link } from "wouter";
import { 
  useGetEmployee, 
  getGetEmployeeQueryKey,
  useGetEmployeePayslips,
  getGetEmployeePayslipsQueryKey,
  useListLeaveRequests,
  getListLeaveRequestsQueryKey
} from "@workspace/api-client-react";
import { ArrowLeft, Building2, Briefcase, Mail, Phone, Calendar, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency, formatDate, formatMonth } from "@/lib/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export default function EmployeeDetail() {
  const { id } = useParams();
  const employeeId = parseInt(id || "0", 10);

  const { data: employee, isLoading: empLoading } = useGetEmployee(employeeId, {
    query: { queryKey: getGetEmployeeQueryKey(employeeId), enabled: !!employeeId }
  });

  const { data: payslips = [], isLoading: payslipsLoading } = useGetEmployeePayslips(employeeId, {
    query: { queryKey: getGetEmployeePayslipsQueryKey(employeeId), enabled: !!employeeId }
  });

  const { data: leaves = [], isLoading: leavesLoading } = useListLeaveRequests(
    { employeeId },
    { query: { queryKey: getListLeaveRequestsQueryKey({ employeeId }), enabled: !!employeeId } }
  );

  if (empLoading) {
    return <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-[200px] w-full" />
    </div>;
  }

  if (!employee) {
    return <div>Employee not found.</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/employees">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{employee.firstName} {employee.lastName}</h1>
          <p className="text-muted-foreground">{employee.employeeNumber} • {employee.jobTitle}</p>
        </div>
        <div className="ml-auto">
          <StatusBadge status={employee.status} />
        </div>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="mb-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="payslips">Payslips</TabsTrigger>
          <TabsTrigger value="leave">Leave Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{employee.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{employee.phone || "N/A"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span>{employee.departmentName || "No Department"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                  <span className="capitalize">{employee.employmentType}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Hired: {formatDate(employee.hireDate)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payroll Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Gross Salary</span>
                  <span className="font-semibold text-lg">{formatCurrency(employee.grossSalary)}</span>
                </div>
                <div className="space-y-2 py-2 border-b">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">KRA PIN</span>
                    <span className="font-mono">{employee.kraPin || "N/A"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">NSSF Number</span>
                    <span className="font-mono">{employee.nssfNumber || "N/A"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">SHIF Number</span>
                    <span className="font-mono">{employee.shifNumber || "N/A"}</span>
                  </div>
                </div>
                <div className="space-y-2 py-2">
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-muted-foreground">Payment Method</span>
                    <span className="capitalize">{employee.paymentMethod}</span>
                  </div>
                  {employee.paymentMethod === "bank" ? (
                    <div className="text-sm text-right text-muted-foreground mt-1">
                      {employee.bankName} • {employee.bankAccount}
                    </div>
                  ) : (
                    <div className="text-sm text-right text-muted-foreground mt-1">
                      M-Pesa: {employee.mpesaNumber}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payslips">
          <Card>
            <CardHeader>
              <CardTitle>Payslips</CardTitle>
              <CardDescription>Recent payroll entries for this employee.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Gross Pay</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead>Net Pay</TableHead>
                    <TableHead>Disbursement</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payslipsLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading payslips...</TableCell>
                    </TableRow>
                  ) : payslips.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No payslips generated yet.</TableCell>
                    </TableRow>
                  ) : (
                    payslips.map(ps => {
                      const totalDeductions = (ps.paye || 0) + (ps.nssfEmployee || 0) + (ps.shif || 0) + (ps.housingLevyEmployee || 0);
                      return (
                        <TableRow key={ps.id}>
                          <TableCell className="font-medium">{formatMonth(ps.month, ps.year)}</TableCell>
                          <TableCell>{formatCurrency(ps.grossSalary)}</TableCell>
                          <TableCell className="text-red-500">-{formatCurrency(totalDeductions)}</TableCell>
                          <TableCell className="font-bold">{formatCurrency(ps.netPay)}</TableCell>
                          <TableCell><StatusBadge status={ps.disbursementStatus || "pending"} /></TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave">
          <Card>
            <CardHeader>
              <CardTitle>Leave History</CardTitle>
              <CardDescription>Recent leave applications.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leavesLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading leave requests...</TableCell>
                    </TableRow>
                  ) : leaves.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No leave history.</TableCell>
                    </TableRow>
                  ) : (
                    leaves.map(req => (
                      <TableRow key={req.id}>
                        <TableCell className="font-medium">{req.leaveTypeName}</TableCell>
                        <TableCell className="text-sm">
                          {formatDate(req.startDate)} - {formatDate(req.endDate)}
                        </TableCell>
                        <TableCell>{req.days}</TableCell>
                        <TableCell><StatusBadge status={req.status} /></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
