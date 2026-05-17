export interface TaxCalculation {
  grossSalary: number;
  nssfEmployee: number;
  nssfEmployer: number;
  shif: number;
  housingLevyEmployee: number;
  housingLevyEmployer: number;
  taxableIncome: number;
  grossPaye: number;
  personalRelief: number;
  insuranceRelief: number;
  netPaye: number;
  netPay: number;
  totalEmployerCost: number;
}

export interface TaxSettings {
  nssfTier1Limit: number;
  nssfTier2Limit: number;
  nssfTier1Rate: number;
  nssfTier2Rate: number;
  shifRate: number;
  shifMinimum: number;
  housingLevyRate: number;
  personalRelief: number;
  insuranceReliefRate: number;
  payeBands: { minAmount: number; maxAmount: number; rate: number }[];
}

export function getDefaultTaxSettings(): TaxSettings {
  return {
    nssfTier1Limit: 7000,
    nssfTier2Limit: 36000,
    nssfTier1Rate: 6.0,
    nssfTier2Rate: 6.0,
    shifRate: 2.75,
    shifMinimum: 300,
    housingLevyRate: 1.5,
    personalRelief: 2400,
    insuranceReliefRate: 15.0,
    payeBands: [
      { minAmount: 0, maxAmount: 24000, rate: 0.10 },
      { minAmount: 24000, maxAmount: 32333, rate: 0.25 },
      { minAmount: 32333, maxAmount: 500000, rate: 0.30 },
      { minAmount: 500000, maxAmount: 800000, rate: 0.325 },
      { minAmount: 800000, maxAmount: 999999999, rate: 0.35 },
    ],
  };
}

export function calculateNSSF(grossSalary: number, settings: TaxSettings): { employee: number; employer: number } {
  const tier1Base = Math.min(grossSalary, settings.nssfTier1Limit);
  const tier2Base = Math.max(0, Math.min(grossSalary, settings.nssfTier2Limit) - settings.nssfTier1Limit);

  const tier1Employee = tier1Base * (settings.nssfTier1Rate / 100);
  const tier2Employee = tier2Base * (settings.nssfTier2Rate / 100);
  const employee = Math.round((tier1Employee + tier2Employee) * 100) / 100;
  const employer = employee;

  return { employee, employer };
}

export function calculateSHIF(grossSalary: number, settings: TaxSettings): number {
  const amount = grossSalary * (settings.shifRate / 100);
  return Math.round(Math.max(amount, settings.shifMinimum) * 100) / 100;
}

export function calculateHousingLevy(grossSalary: number, settings: TaxSettings): { employee: number; employer: number } {
  const employee = Math.round(grossSalary * (settings.housingLevyRate / 100) * 100) / 100;
  const employer = employee;
  return { employee, employer };
}

export function calculatePAYE(taxableIncome: number, bands: { minAmount: number; maxAmount: number; rate: number }[]): number {
  let tax = 0;
  for (const band of bands) {
    if (taxableIncome <= band.minAmount) break;
    const taxableInBand = Math.min(taxableIncome, band.maxAmount) - band.minAmount;
    if (taxableInBand > 0) {
      tax += taxableInBand * band.rate;
    }
  }
  return Math.round(Math.max(0, tax) * 100) / 100;
}

export function calculateInsuranceRelief(shif: number, settings: TaxSettings): number {
  return Math.round(shif * (settings.insuranceReliefRate / 100) * 100) / 100;
}

export function calculateAll(grossSalary: number, settings?: TaxSettings): TaxCalculation {
  const s = settings ?? getDefaultTaxSettings();
  const nssf = calculateNSSF(grossSalary, s);
  const shif = calculateSHIF(grossSalary, s);
  const housingLevy = calculateHousingLevy(grossSalary, s);
  const insuranceRelief = calculateInsuranceRelief(shif, s);

  const taxableIncome = Math.max(0, grossSalary - nssf.employee - housingLevy.employee);

  const grossPaye = calculatePAYE(taxableIncome, s.payeBands);
  const netPaye = Math.max(0, grossPaye - s.personalRelief - insuranceRelief);

  const netPay = Math.round(
    (grossSalary - nssf.employee - shif - housingLevy.employee - netPaye) * 100
  ) / 100;

  const totalEmployerCost = Math.round(
    (grossSalary + nssf.employer + housingLevy.employer) * 100
  ) / 100;

  return {
    grossSalary,
    nssfEmployee: nssf.employee,
    nssfEmployer: nssf.employer,
    shif,
    housingLevyEmployee: housingLevy.employee,
    housingLevyEmployer: housingLevy.employer,
    taxableIncome,
    grossPaye,
    personalRelief: s.personalRelief,
    insuranceRelief,
    netPaye,
    netPay,
    totalEmployerCost,
  };
}
