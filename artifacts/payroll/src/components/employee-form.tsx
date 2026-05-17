import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useListDepartments } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const employeeSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  departmentId: z.coerce.number().optional(),
  jobTitle: z.string().optional(),
  grossSalary: z.coerce.number().min(0, "Gross salary must be positive"),
  employmentType: z.enum(["permanent", "contract"]),
  paymentMethod: z.enum(["mpesa", "bank"]),
  mpesaNumber: z.string().optional(),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  bankBranch: z.string().optional(),
  kraPin: z.string().optional(),
  nssfNumber: z.string().optional(),
  shifNumber: z.string().optional(),
  nationalId: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  maritalStatus: z.enum(["single", "married", "divorced", "widowed"]).optional(),
  dependents: z.coerce.number().optional(),
  postalAddress: z.string().optional(),
  nextOfKinName: z.string().optional(),
  nextOfKinPhone: z.string().optional(),
  nextOfKinRelationship: z.string().optional(),
  photoUrl: z.string().optional(),
  probationEndDate: z.string().optional(),
  contractEndDate: z.string().optional(),
  isDisabled: z.boolean().optional(),
  hireDate: z.string().min(1, "Hire date is required"),
  role: z.enum(["admin", "hr", "employee"]).optional(),
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
  defaultValues?: Partial<EmployeeFormValues>;
  onSubmit: (data: EmployeeFormValues) => void;
  isPending?: boolean;
  submitLabel?: string;
}

export function EmployeeForm({ defaultValues, onSubmit, isPending, submitLabel = "Save" }: EmployeeFormProps) {
  const { data: departments = [] } = useListDepartments();

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      jobTitle: "",
      grossSalary: 0,
      employmentType: "permanent",
      paymentMethod: "bank",
      mpesaNumber: "",
      bankName: "",
      bankAccount: "",
      bankBranch: "",
      kraPin: "",
      nssfNumber: "",
      shifNumber: "",
      nationalId: "",
      dateOfBirth: "",
      gender: undefined,
      maritalStatus: undefined,
      dependents: 0,
      postalAddress: "",
      nextOfKinName: "",
      nextOfKinPhone: "",
      nextOfKinRelationship: "",
      photoUrl: "",
      probationEndDate: "",
      contractEndDate: "",
      isDisabled: false,
      hireDate: new Date().toISOString().split("T")[0],
      role: "employee",
      ...defaultValues,
    },
  });

  const watchPaymentMethod = form.watch("paymentMethod");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Basic contact details for the employee.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="firstName" render={({ field }) => (
              <FormItem><FormLabel>First Name</FormLabel><FormControl><Input placeholder="John" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="lastName" render={({ field }) => (
              <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input placeholder="Doe" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="john.doe@example.com" type="email" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="phone" render={({ field }) => (
              <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="+254..." {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="nationalId" render={({ field }) => (
              <FormItem><FormLabel>National ID</FormLabel><FormControl><Input placeholder="ID Number" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
              <FormItem><FormLabel>Date of Birth</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="gender" render={({ field }) => (
              <FormItem><FormLabel>Gender</FormLabel><Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="maritalStatus" render={({ field }) => (
              <FormItem><FormLabel>Marital Status</FormLabel><Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married">Married</SelectItem>
                  <SelectItem value="divorced">Divorced</SelectItem>
                  <SelectItem value="widowed">Widowed</SelectItem>
                </SelectContent>
              </Select><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="dependents" render={({ field }) => (
              <FormItem><FormLabel>Dependents</FormLabel><FormControl><Input type="number" min="0" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="postalAddress" render={({ field }) => (
              <FormItem><FormLabel>Postal Address</FormLabel><FormControl><Input placeholder="P.O. Box..." {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="nextOfKinName" render={({ field }) => (
              <FormItem><FormLabel>Next of Kin Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="nextOfKinPhone" render={({ field }) => (
              <FormItem><FormLabel>Next of Kin Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="nextOfKinRelationship" render={({ field }) => (
              <FormItem><FormLabel>Next of Kin Relationship</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employment Details</CardTitle>
            <CardDescription>Job title, department, and salary information.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="departmentId" render={({ field }) => (
              <FormItem><FormLabel>Department</FormLabel>
                <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value?.toString()}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select a department" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="jobTitle" render={({ field }) => (
              <FormItem><FormLabel>Job Title</FormLabel><FormControl><Input placeholder="Software Engineer" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="grossSalary" render={({ field }) => (
              <FormItem><FormLabel>Gross Salary (KSh)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="employmentType" render={({ field }) => (
              <FormItem><FormLabel>Employment Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="permanent">Permanent</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="hireDate" render={({ field }) => (
              <FormItem><FormLabel>Hire Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="probationEndDate" render={({ field }) => (
              <FormItem><FormLabel>Probation End Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="contractEndDate" render={({ field }) => (
              <FormItem><FormLabel>Contract End Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="role" render={({ field }) => (
              <FormItem><FormLabel>System Role</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="isDisabled" render={({ field }) => (
              <FormItem className="flex items-center gap-2 mt-6">
                <FormControl>
                  <input type="checkbox" checked={field.value || false} onChange={e => field.onChange(e.target.checked)} className="h-4 w-4" />
                </FormControl>
                <FormLabel className="!mt-0">Person with Disability (PWD)</FormLabel>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statutory & Payment Details</CardTitle>
            <CardDescription>KRA, NSSF, SHIF and disbursement information.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="kraPin" render={({ field }) => (
              <FormItem><FormLabel>KRA PIN</FormLabel><FormControl><Input placeholder="A000000000X" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="nssfNumber" render={({ field }) => (
              <FormItem><FormLabel>NSSF Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="shifNumber" render={({ field }) => (
              <FormItem><FormLabel>SHIF Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="paymentMethod" render={({ field }) => (
              <FormItem><FormLabel>Payment Method</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            {watchPaymentMethod === "bank" && (
              <>
                <FormField control={form.control} name="bankName" render={({ field }) => (
                  <FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="bankBranch" render={({ field }) => (
                  <FormItem><FormLabel>Bank Branch</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="bankAccount" render={({ field }) => (
                  <FormItem><FormLabel>Account Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </>
            )}
            {watchPaymentMethod === "mpesa" && (
              <FormField control={form.control} name="mpesaNumber" render={({ field }) => (
                <FormItem><FormLabel>M-Pesa Number</FormLabel><FormControl><Input placeholder="07XX..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
