import { Link, useLocation } from "wouter";
import { useCreateEmployee, getListEmployeesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { EmployeeForm, type EmployeeFormValues } from "@/components/employee-form";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

export default function EmployeeNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createEmployee = useCreateEmployee();

  function onSubmit(data: EmployeeFormValues) {
    createEmployee.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Employee Created", description: "The new employee has been successfully added." });
        queryClient.invalidateQueries({ queryKey: getListEmployeesQueryKey() });
        setLocation("/employees");
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to create employee.", variant: "destructive" });
      },
    });
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/employees">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add New Employee</h1>
          <p className="text-muted-foreground">Enter employee details to register them in the system.</p>
        </div>
      </div>
      <EmployeeForm onSubmit={onSubmit} isPending={createEmployee.isPending} submitLabel="Save Employee" />
    </div>
  );
}
