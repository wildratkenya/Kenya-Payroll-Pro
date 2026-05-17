import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Filter } from "lucide-react";
import { 
  useListEmployees, 
  getListEmployeesQueryKey 
} from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";

export default function EmployeesList() {
  const [search, setSearch] = useState("");

  const { data: employees = [], isLoading } = useListEmployees(
    { search: search || undefined }, 
    { query: { queryKey: getListEmployeesQueryKey({ search: search || undefined }) } }
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">Manage your workforce and payroll details.</p>
        </div>
        <Link href="/employees/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" /> Add Employee
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search employees..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Gross Salary</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Loading employees...
                </TableCell>
              </TableRow>
            ) : employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No employees found.
                </TableCell>
              </TableRow>
            ) : (
              employees.map((emp) => (
                <TableRow key={emp.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <Link href={`/employees/${emp.id}`} className="block">
                      <div className="font-medium text-foreground">
                        {emp.firstName} {emp.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">{emp.email}</div>
                    </Link>
                  </TableCell>
                  <TableCell>{emp.departmentName || "-"}</TableCell>
                  <TableCell className="capitalize">{emp.jobTitle || "-"}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(emp.grossSalary)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={emp.status} />
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
