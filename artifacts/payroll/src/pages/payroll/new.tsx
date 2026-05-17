import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreatePayrollRun } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, PlayCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const payrollRunSchema = z.object({
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(currentYear - 2).max(currentYear + 1),
});

type PayrollRunFormValues = z.infer<typeof payrollRunSchema>;

export default function PayrollRunNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createPayrollRun = useCreatePayrollRun();

  const form = useForm<PayrollRunFormValues>({
    resolver: zodResolver(payrollRunSchema),
    defaultValues: {
      month: currentMonth,
      year: currentYear,
    },
  });

  function onSubmit(data: PayrollRunFormValues) {
    createPayrollRun.mutate({ data }, {
      onSuccess: (run) => {
        toast({
          title: "Payroll Run Initiated",
          description: "Calculations are processing in the background.",
        });
        setLocation(`/payroll/${run.id}`);
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to create payroll run.",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto mt-10">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/payroll">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Payroll Run</h1>
          <p className="text-muted-foreground">Select the period to process salaries for all active employees.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Processing Period</CardTitle>
          <CardDescription>Select the month and year for this payroll cycle.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="month"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Month</FormLabel>
                      <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select month" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {months.map((month, idx) => (
                            <SelectItem key={idx + 1} value={(idx + 1).toString()}>{month}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="w-full" disabled={createPayrollRun.isPending}>
                {createPayrollRun.isPending ? "Starting Run..." : "Generate Payroll"}
                {!createPayrollRun.isPending && <PlayCircle className="ml-2 w-4 h-4" />}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
