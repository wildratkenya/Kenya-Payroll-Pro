import { useListDepartments, getListDepartmentsQueryKey, useListLeaveTypes, getListLeaveTypesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
  const { data: departments, isLoading: deptsLoading } = useListDepartments({
    query: { queryKey: getListDepartmentsQueryKey() }
  });

  const { data: leaveTypes, isLoading: leavesLoading } = useListLeaveTypes({
    query: { queryKey: getListLeaveTypesQueryKey() }
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground">Configure departments and leave policies.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Departments</CardTitle>
              <CardDescription>Manage company departments.</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" /> Add
            </Button>
          </CardHeader>
          <CardContent>
            {deptsLoading ? <Skeleton className="h-48 w-full" /> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Employees</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments?.map(dept => (
                    <TableRow key={dept.id}>
                      <TableCell className="font-medium">{dept.name}</TableCell>
                      <TableCell className="text-right">{dept.employeeCount || 0}</TableCell>
                    </TableRow>
                  ))}
                  {(!departments || departments.length === 0) && (
                    <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No departments</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Leave Types</CardTitle>
              <CardDescription>Annual allocations.</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" /> Add
            </Button>
          </CardHeader>
          <CardContent>
            {leavesLoading ? <Skeleton className="h-48 w-full" /> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Days/Year</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveTypes?.map(lt => (
                    <TableRow key={lt.id}>
                      <TableCell className="font-medium">{lt.name}</TableCell>
                      <TableCell className="text-right">{lt.daysAllowed}</TableCell>
                    </TableRow>
                  ))}
                  {(!leaveTypes || leaveTypes.length === 0) && (
                    <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No leave types</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
