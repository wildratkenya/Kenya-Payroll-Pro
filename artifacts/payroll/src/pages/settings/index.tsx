import { useState, useEffect } from "react";
import { useListDepartments, getListDepartmentsQueryKey, useListLeaveTypes, getListLeaveTypesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Save, Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface TaxRate {
  id: number;
  key: string;
  label: string;
  value: number;
  description: string;
}

interface TaxBracket {
  id: number;
  name: string;
  minAmount: number;
  maxAmount: number;
  rate: number;
  priority: number;
}

interface CompanySettings {
  id: number;
  companyName: string;
  companyAddress: string | null;
  companyPhone: string | null;
  companyEmail: string | null;
  companyLogoUrl: string | null;
  kraPin: string | null;
  payrollFooter: string | null;
}

function TaxSettings() {
  const { toast } = useToast();
  const [rates, setRates] = useState<TaxRate[]>([]);
  const [brackets, setBrackets] = useState<TaxBracket[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedRates, setEditedRates] = useState<Record<number, number>>({});
  const [editedBrackets, setEditedBrackets] = useState<Record<number, Partial<TaxBracket>>>({});

  useEffect(() => {
    Promise.all([
      fetch("/api/settings/tax-rates").then(r => r.json()),
      fetch("/api/settings/tax-brackets").then(r => r.json()),
    ]).then(([ratesData, bracketsData]) => {
      setRates(ratesData);
      setBrackets(bracketsData);
      setLoading(false);
    });
  }, []);

  async function saveRates() {
    setSaving(true);
    try {
      for (const [idStr, value] of Object.entries(editedRates)) {
        await fetch(`/api/settings/tax-rates/${idStr}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value }),
        });
      }
      for (const [idStr, updates] of Object.entries(editedBrackets)) {
        await fetch(`/api/settings/tax-brackets/${idStr}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
      }
      const [ratesData, bracketsData] = await Promise.all([
        fetch("/api/settings/tax-rates").then(r => r.json()),
        fetch("/api/settings/tax-brackets").then(r => r.json()),
      ]);
      setRates(ratesData);
      setBrackets(bracketsData);
      setEditedRates({});
      setEditedBrackets({});
      toast({ title: "Tax settings saved", description: "New rates will apply to future payroll runs." });
    } catch {
      toast({ title: "Error", description: "Failed to save tax settings.", variant: "destructive" });
    }
    setSaving(false);
  }

  const hasChanges = Object.keys(editedRates).length > 0 || Object.keys(editedBrackets).length > 0;

  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Tax Configuration</CardTitle>
          <CardDescription>Adjustable Kenyan payroll tax rates and PAYE brackets.</CardDescription>
        </div>
        {hasChanges && (
          <Button onClick={saveRates} disabled={saving}>
            <Save className="w-4 h-4 mr-2" /> {saving ? "Saving..." : "Save Changes"}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold mb-3">Tax Rates</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parameter</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rates.map(rate => (
                <TableRow key={rate.id}>
                  <TableCell className="font-medium">{rate.label}</TableCell>
                  <TableCell className="w-40">
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        step="any"
                        className="h-8 w-28 text-right"
                        defaultValue={rate.value}
                        onChange={e => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) {
                            setEditedRates(prev => ({ ...prev, [rate.id]: val }));
                          }
                        }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {rate.key.includes("rate") || rate.key.includes("Rate") ? "%" : "KES"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{rate.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3">PAYE Tax Brackets</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>From (KES)</TableHead>
                <TableHead>To (KES)</TableHead>
                <TableHead>Rate (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brackets.map(b => (
                <TableRow key={b.id}>
                  <TableCell>
                    <Input
                      type="number"
                      className="h-8"
                      defaultValue={b.minAmount}
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) setEditedBrackets(prev => ({ ...prev, [b.id]: { ...prev[b.id], minAmount: val } }));
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      className="h-8"
                      defaultValue={b.maxAmount === 999999999 ? "" : b.maxAmount}
                      placeholder="Unlimited"
                      onChange={e => {
                        const raw = e.target.value;
                        if (raw === "") {
                          setEditedBrackets(prev => ({ ...prev, [b.id]: { ...prev[b.id], maxAmount: 999999999 } }));
                        } else {
                          const val = parseFloat(raw);
                          if (!isNaN(val)) setEditedBrackets(prev => ({ ...prev, [b.id]: { ...prev[b.id], maxAmount: val } }));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        step="0.1"
                        className="h-8 w-24"
                        defaultValue={b.rate * 100}
                        onChange={e => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) setEditedBrackets(prev => ({ ...prev, [b.id]: { ...prev[b.id], rate: val / 100 } }));
                        }}
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function CompanyBranding() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<CompanySettings>>({});

  useEffect(() => {
    fetch("/api/settings/company")
      .then(r => r.json())
      .then(data => {
        setSettings(data);
        setForm(data);
        setLoading(false);
      });
  }, []);

  function handleChange(field: keyof CompanySettings, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setSettings(data);
        toast({ title: "Company settings saved" });
      } else {
        toast({ title: "Error", description: data.error || "Failed to save", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to save company settings.", variant: "destructive" });
    }
    setSaving(false);
  }

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(form);

  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Company Branding</CardTitle>
          <CardDescription>Company name, address, and details used on payslips and emails.</CardDescription>
        </div>
        {hasChanges && (
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" /> {saving ? "Saving..." : "Save"}
          </Button>
        )}
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Company Name</label>
          <Input value={form.companyName || ""} onChange={e => handleChange("companyName", e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Company Email</label>
          <Input type="email" value={form.companyEmail || ""} onChange={e => handleChange("companyEmail", e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Company Phone</label>
          <Input value={form.companyPhone || ""} onChange={e => handleChange("companyPhone", e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Company KRA PIN</label>
          <Input value={form.kraPin || ""} onChange={e => handleChange("kraPin", e.target.value)} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Company Address</label>
          <Input value={form.companyAddress || ""} onChange={e => handleChange("companyAddress", e.target.value)} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Logo URL</label>
          <Input placeholder="https://example.com/logo.png" value={form.companyLogoUrl || ""} onChange={e => handleChange("companyLogoUrl", e.target.value)} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Payslip Footer Text</label>
          <Input value={form.payrollFooter || ""} onChange={e => handleChange("payrollFooter", e.target.value)} />
        </div>
      </CardContent>
    </Card>
  );
}

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
        <p className="text-muted-foreground">Configure departments, leave policies, tax rates, and company branding.</p>
      </div>

      <CompanyBranding />

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

      <TaxSettings />
    </div>
  );
}
