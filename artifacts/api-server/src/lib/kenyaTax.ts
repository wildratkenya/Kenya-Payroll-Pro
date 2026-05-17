/**
 * Kenya Tax Calculations (2024/2025 rates)
 * - PAYE: Progressive income tax
 * - NSSF: National Social Security Fund (Tier I + Tier II)
 * - SHIF: Social Health Insurance Fund (2.75% of gross)
 * - Housing Levy: 1.5% employee + 1.5% employer of gross
 * - Personal Relief: KSh 2,400/month
 * - Insurance Relief: 15% of SHIF contribution
 */

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

// NSSF Tier rates (2024)
const NSSF_LOWER_LIMIT = 7000;
const NSSF_UPPER_LIMIT = 36000;
const NSSF_TIER1_RATE = 0.06; // 6% each
const NSSF_TIER2_RATE = 0.06; // 6% each

// SHIF rate (2024)
const SHIF_RATE = 0.0275; // 2.75%
const SHIF_MINIMUM = 300;

// Housing Levy rate (2024)
const HOUSING_LEVY_RATE = 0.015; // 1.5% each

// Personal Relief
const PERSONAL_RELIEF = 2400;

// PAYE bands (monthly, 2024)
const PAYE_BANDS = [
  { max: 24000, rate: 0.10 },
  { max: 32333, rate: 0.25 },
  { max: 500000, rate: 0.30 },
  { max: 800000, rate: 0.325 },
  { max: Infinity, rate: 0.35 },
];

export function calculateNSSF(grossSalary: number): { employee: number; employer: number } {
  // Tier I: 6% of earnings up to lower earnings limit (KSh 7,000)
  // Tier II: 6% of earnings from lower to upper earnings limit
  const tier1Base = Math.min(grossSalary, NSSF_LOWER_LIMIT);
  const tier2Base = Math.max(0, Math.min(grossSalary, NSSF_UPPER_LIMIT) - NSSF_LOWER_LIMIT);

  const tier1Employee = tier1Base * NSSF_TIER1_RATE;
  const tier2Employee = tier2Base * NSSF_TIER2_RATE;
  const employee = Math.round((tier1Employee + tier2Employee) * 100) / 100;

  // Employer mirrors employee
  const employer = employee;

  return { employee, employer };
}

export function calculateSHIF(grossSalary: number): number {
  const amount = grossSalary * SHIF_RATE;
  return Math.round(Math.max(amount, SHIF_MINIMUM) * 100) / 100;
}

export function calculateHousingLevy(grossSalary: number): { employee: number; employer: number } {
  const employee = Math.round(grossSalary * HOUSING_LEVY_RATE * 100) / 100;
  const employer = employee;
  return { employee, employer };
}

export function calculatePAYE(taxableIncome: number): number {
  let tax = 0;
  let previous = 0;

  for (const band of PAYE_BANDS) {
    if (taxableIncome <= previous) break;
    const taxableInBand = Math.min(taxableIncome, band.max) - previous;
    tax += taxableInBand * band.rate;
    previous = band.max;
  }

  return Math.round(Math.max(0, tax) * 100) / 100;
}

export function calculateInsuranceRelief(shif: number): number {
  // 15% of SHIF contributions
  return Math.round(shif * 0.15 * 100) / 100;
}

export function calculateAll(grossSalary: number): TaxCalculation {
  const nssf = calculateNSSF(grossSalary);
  const shif = calculateSHIF(grossSalary);
  const housingLevy = calculateHousingLevy(grossSalary);
  const insuranceRelief = calculateInsuranceRelief(shif);

  // Taxable income = Gross - NSSF employee - Housing levy employee
  const taxableIncome = Math.max(0, grossSalary - nssf.employee - housingLevy.employee);

  const grossPaye = calculatePAYE(taxableIncome);
  const netPaye = Math.max(0, grossPaye - PERSONAL_RELIEF - insuranceRelief);

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
    personalRelief: PERSONAL_RELIEF,
    insuranceRelief,
    netPaye,
    netPay,
    totalEmployerCost,
  };
}
