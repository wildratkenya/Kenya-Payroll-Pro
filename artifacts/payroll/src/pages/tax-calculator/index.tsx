import { useState, useEffect } from "react";
import { Calculator, AlertCircle } from "lucide-react";
import { usePreviewTaxCalculation } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function TaxCalculator() {
  const [grossStr, setGrossStr] = useState("50000");
  const [debouncedGross, setDebouncedGross] = useState(50000);

  const taxMutation = usePreviewTaxCalculation();

  useEffect(() => {
    const timer = setTimeout(() => {
      const val = parseFloat(grossStr.replace(/,/g, ""));
      if (!isNaN(val) && val >= 0) {
        setDebouncedGross(val);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [grossStr]);

  useEffect(() => {
    taxMutation.mutate({ data: { grossSalary: debouncedGross } });
  }, [debouncedGross]);

  const result = taxMutation.data;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tax Calculator</h1>
        <p className="text-muted-foreground">Estimate PAYE, NSSF, SHIF, and Housing Levy based on latest KRA rates.</p>
      </div>

      <div className="grid md:grid-cols-12 gap-6">
        <div className="md:col-span-5 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Input</CardTitle>
              <CardDescription>Enter the monthly gross salary.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gross">Gross Salary (KSh)</Label>
                <div className="relative">
                  <Calculator className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="gross"
                    type="text"
                    value={grossStr}
                    onChange={(e) => setGrossStr(e.target.value)}
                    className="pl-9 text-lg font-medium"
                    placeholder="e.g. 50,000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Tax Compliance</AlertTitle>
            <AlertDescription className="text-xs">
              Calculations are based on the latest NSSF Tier I & II rates, the new SHIF (Social Health Insurance Fund) at 2.75%, and the 1.5% Affordable Housing Levy.
            </AlertDescription>
          </Alert>
        </div>

        <div className="md:col-span-7">
          <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-4">
              <CardTitle>Payslip Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {taxMutation.isPending && !result ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">Calculating...</div>
              ) : result ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-800">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Gross Pay</span>
                    <span className="font-bold text-lg">{formatCurrency(result.grossSalary)}</span>
                  </div>

                  <div className="space-y-2 py-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Deductions</h4>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">NSSF (Tier I & II)</span>
                      <span className="text-red-600 dark:text-red-400">-{formatCurrency(result.nssfEmployee)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">SHIF (2.75%)</span>
                      <span className="text-red-600 dark:text-red-400">-{formatCurrency(result.shif)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Housing Levy (1.5%)</span>
                      <span className="text-red-600 dark:text-red-400">-{formatCurrency(result.housingLevyEmployee)}</span>
                    </div>
                  </div>

                  <div className="space-y-2 py-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Taxable Pay</span>
                      <span>{formatCurrency(result.taxableIncome)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">PAYE Before Relief</span>
                      <span>{formatCurrency(result.paye)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Personal Relief</span>
                      <span className="text-green-600 dark:text-green-400">+{formatCurrency(result.personalRelief)}</span>
                    </div>
                    {result.insuranceRelief ? (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Insurance Relief</span>
                        <span className="text-green-600 dark:text-green-400">+{formatCurrency(result.insuranceRelief)}</span>
                      </div>
                    ) : null}
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-slate-700 dark:text-slate-300">Net PAYE</span>
                      <span className="text-red-600 dark:text-red-400">-{formatCurrency(result.netPaye)}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-4 border-t-2 border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-lg">Net Pay</span>
                    <span className="font-black text-2xl text-primary">{formatCurrency(result.netPay)}</span>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2 bg-amber-50/50 dark:bg-amber-950/10 p-4 rounded-lg">
                    <h4 className="text-xs font-semibold text-amber-800 dark:text-amber-500 uppercase tracking-wider">Employer Contributions</h4>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">NSSF</span>
                      <span>{formatCurrency(result.nssfEmployer)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Housing Levy</span>
                      <span>{formatCurrency(result.housingLevyEmployer)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold pt-1 border-t border-amber-200 dark:border-amber-900/30">
                      <span className="text-slate-700 dark:text-slate-300">Total Employer Cost</span>
                      <span>{formatCurrency(result.totalEmployerCost)}</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
