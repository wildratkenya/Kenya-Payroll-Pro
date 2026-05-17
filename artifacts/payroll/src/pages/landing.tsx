import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, ShieldCheck, Wallet } from "lucide-react";

export default function LandingPage() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <div className="min-h-[100dvh] flex flex-col bg-slate-50">
      <header className="px-6 lg:px-12 h-20 flex items-center justify-between border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <img src={`${basePath}/logo.svg`} alt="KenyaPay" className="w-8 h-8" />
          <span className="text-xl font-bold text-slate-900 tracking-tight">KenyaPay</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/sign-in">
            <Button variant="ghost" className="text-slate-600 font-medium">Log in</Button>
          </Link>
          <Link href="/sign-up">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="px-6 lg:px-12 py-20 md:py-32 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-sm text-teal-800 font-medium">
                <span className="flex h-2 w-2 rounded-full bg-teal-600 mr-2"></span>
                Built for Kenyan Businesses
              </div>
              <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Modern payroll, <br/>
                <span className="text-primary">fully compliant.</span>
              </h1>
              <p className="text-xl text-slate-600 leading-relaxed max-w-lg">
                Automate PAYE, NSSF, SHIF, and Housing Levy calculations. Process payments directly to M-Pesa or bank accounts in one click.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/sign-up">
                  <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-base bg-primary hover:bg-primary/90">
                    Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/sign-in">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-base border-slate-300 text-slate-700">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-tr from-teal-100 to-amber-50 rounded-3xl blur-2xl opacity-50"></div>
              <div className="relative bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">Payroll Run</h3>
                    <p className="text-sm text-slate-500">October 2025</p>
                  </div>
                  <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    Approved
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-600">Total Net Pay</span>
                    <span className="font-bold text-slate-900">KSh 1,245,000.00</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-600">PAYE Deducted</span>
                    <span className="font-semibold text-slate-700">KSh 342,100.00</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-600">NSSF & SHIF</span>
                    <span className="font-semibold text-slate-700">KSh 89,400.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-900 py-24">
          <div className="max-w-6xl mx-auto px-6 lg:px-12">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white mb-4">Everything you need to run payroll</h2>
              <p className="text-slate-400 text-lg">Powerful features designed specifically for the Kenyan market.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700">
                <div className="w-12 h-12 bg-teal-900/50 rounded-lg flex items-center justify-center mb-6">
                  <ShieldCheck className="w-6 h-6 text-teal-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">100% KRA Compliant</h3>
                <p className="text-slate-400 leading-relaxed">
                  Always up-to-date with the latest tax brackets, personal relief, NSSF rates, SHIF, and Housing Levy rules.
                </p>
              </div>
              <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700">
                <div className="w-12 h-12 bg-amber-900/30 rounded-lg flex items-center justify-center mb-6">
                  <Wallet className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">M-Pesa Integration</h3>
                <p className="text-slate-400 leading-relaxed">
                  Disburse salaries directly to employee M-Pesa numbers or bank accounts with a single click after approval.
                </p>
              </div>
              <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700">
                <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Self-Service Portal</h3>
                <p className="text-slate-400 leading-relaxed">
                  Employees can view their payslips, apply for leave, and update their bank details without HR intervention.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-6xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <img src={`${basePath}/logo.svg`} alt="KenyaPay" className="w-6 h-6 grayscale opacity-60" />
            <span className="font-semibold text-slate-500">KenyaPay</span>
          </div>
          <p className="text-sm text-slate-500">© 2025 KenyaPay Systems. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
