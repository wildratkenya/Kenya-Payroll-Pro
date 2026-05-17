import { useState, useEffect } from "react";
import { useListEmployees, getListEmployeesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { Printer, Download } from "lucide-react";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const currentYear = new Date().getFullYear();

interface P9Entry {
  month: number;
  grossSalary: number;
  paye: number;
  cumulativeGross: number;
  cumulativePaye: number;
}

interface P9Employee {
  employeeId: number;
  employeeName: string;
  employeeNumber: string;
  kraPin: string | null;
  nationalId: string | null;
  jobTitle: string | null;
  departmentName: string | null;
  year: number;
  monthlyEntries: P9Entry[];
  totalGross: number;
  totalPaye: number;
}

interface P9Company {
  companyName: string;
  companyAddress: string | null;
  kraPin: string | null;
}

interface P9Data {
  company: P9Company;
  employees: P9Employee[];
}

export default function P9Form() {
  const [employeeId, setEmployeeId] = useState<string>("");
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState<P9Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<P9Employee[]>([]);

  const { data: employees = [] } = useListEmployees();

  useEffect(() => {
    if (!data) return;
    if (employeeId) {
      setSelectedEmployees(data.employees.filter(e => e.employeeId === parseInt(employeeId)));
    } else {
      setSelectedEmployees(data.employees);
    }
  }, [data, employeeId]);

  async function loadP9() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ year: year.toString() });
      if (employeeId) params.set("employeeId", employeeId);
      const res = await fetch(`/api/reports/p9?${params}`);
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    }
    setLoading(false);
  }

  function handlePrint() {
    window.print();
  }

  function handleDownloadCSV() {
    if (!data || selectedEmployees.length === 0) return;
    const rows = [["Employee Name","Employee No.","KRA PIN","Month","Gross Salary","PAYE","Cumulative Gross","Cumulative PAYE"]];
    for (const emp of selectedEmployees) {
      for (const m of emp.monthlyEntries) {
        rows.push([
          emp.employeeName,
          emp.employeeNumber,
          emp.kraPin || "",
          MONTHS[m.month - 1] || `Month ${m.month}`,
          m.grossSalary.toString(),
          m.paye.toString(),
          m.cumulativeGross.toString(),
          m.cumulativePaye.toString(),
        ]);
      }
      rows.push(["","","","TOTAL","","","",""]);
      rows.push([emp.employeeName, emp.employeeNumber, "", "Annual Totals", emp.totalGross.toString(), emp.totalPaye.toString(), "", ""]);
      rows.push(["","","","","","","",""]);
    }
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `P9_${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filteredEmployees = employeeId
    ? selectedEmployees
    : (data?.employees || []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold tracking-tight">KRA P9 Form</h2>
          <p className="text-muted-foreground">Annual tax deduction card per employee.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadCSV} disabled={!data}>
            <Download className="w-4 h-4 mr-2" /> CSV
          </Button>
          <Button variant="outline" onClick={handlePrint} disabled={!data}>
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
        </div>
      </div>

      <Card className="bg-slate-50 dark:bg-slate-900/50 border-none shadow-none print:hidden">
        <CardContent className="p-4 flex gap-4 flex-wrap">
          <div className="space-y-1">
            <Label className="text-xs">Employee</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger className="w-[220px] bg-background">
                <SelectValue placeholder="All Employees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Employees</SelectItem>
                {employees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id.toString()}>
                    {emp.firstName} {emp.lastName}
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
                {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map(y => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={loadP9} disabled={loading}>
              {loading ? "Loading..." : "Generate P9"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : !data || filteredEmployees.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            Select a year and click Generate to view P9 forms.
          </CardContent>
        </Card>
      ) : (
        filteredEmployees.map(emp => (
          <Card key={emp.employeeId} className="print:break-after-page print:shadow-none print:border">
            <CardHeader className="text-center border-b print:pb-4">
              <div className="text-lg font-bold">{data.company.companyName}</div>
              {data.company.companyAddress && <div className="text-sm text-muted-foreground">{data.company.companyAddress}</div>}
              {data.company.kraPin && <div className="text-sm text-muted-foreground">KRA PIN: {data.company.kraPin}</div>}
              <CardTitle className="text-lg mt-3">TAX DEDUCTION CARD (P9)</CardTitle>
              <CardDescription>For the year ending 31 December {emp.year}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm border-b pb-4">
                <div><span className="font-medium">Employee Name:</span> {emp.employeeName}</div>
                <div><span className="font-medium">Employee No.:</span> {emp.employeeNumber}</div>
                <div><span className="font-medium">KRA PIN:</span> {emp.kraPin || "N/A"}</div>
                <div><span className="font-medium">National ID:</span> {emp.nationalId || "N/A"}</div>
                <div><span className="font-medium">Job Title:</span> {emp.jobTitle || "N/A"}</div>
                <div><span className="font-medium">Department:</span> {emp.departmentName || "N/A"}</div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Gross Pay (KES)</TableHead>
                    <TableHead className="text-right">PAYE (KES)</TableHead>
                    <TableHead className="text-right">Cumulative Gross (KES)</TableHead>
                    <TableHead className="text-right">Cumulative PAYE (KES)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MONTHS.map((name, i) => {
                    const entry = emp.monthlyEntries.find(m => m.month === i + 1);
                    return (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{name}</TableCell>
                        <TableCell className="text-right">{entry ? formatCurrency(entry.grossSalary) : "-"}</TableCell>
                        <TableCell className="text-right">{entry ? formatCurrency(entry.paye) : "-"}</TableCell>
                        <TableCell className="text-right">{entry ? formatCurrency(entry.cumulativeGross) : "-"}</TableCell>
                        <TableCell className="text-right">{entry ? formatCurrency(entry.cumulativePaye) : "-"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                <TableFooter>
                  <TableRow className="font-bold">
                    <TableCell>Annual Totals</TableCell>
                    <TableCell className="text-right">{formatCurrency(emp.totalGross)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(emp.totalPaye)}</TableCell>
                    <TableCell colSpan={2} />
                  </TableRow>
                </TableFooter>
              </Table>

              <div className="mt-6 text-xs text-muted-foreground text-center border-t pt-4">
                This is a computer-generated P9 form. Generated by Kenya Payroll Pro.
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
