import { useMemo, useState } from 'react';

type ExperienceLevel = 'Entry' | 'Mid' | 'Senior' | 'Lead';

type LocationTier = 'Tier 1' | 'Tier 2' | 'Remote';

const baseSalaries: Record<string, number> = {
  'Software Engineer': 125000,
  'Product Manager': 118000,
  'Data Scientist': 120000,
  'UX Designer': 105000,
  'Customer Success Manager': 90000
};

const experienceMultipliers: Record<ExperienceLevel, number> = {
  Entry: 0.85,
  Mid: 1,
  Senior: 1.25,
  Lead: 1.45
};

const locationAdjustments: Record<LocationTier, number> = {
  'Tier 1': 1.2,
  'Tier 2': 1,
  Remote: 0.95
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
}

function SalaryCalculator() {
  const [role, setRole] = useState<string>('Software Engineer');
  const [experience, setExperience] = useState<ExperienceLevel>('Mid');
  const [location, setLocation] = useState<LocationTier>('Tier 2');

  const estimate = useMemo(() => {
    const base = baseSalaries[role] ?? 100000;
    const baseWithExperience = base * experienceMultipliers[experience];
    const adjusted = baseWithExperience * locationAdjustments[location];
    const low = adjusted * 0.9;
    const high = adjusted * 1.15;

    return {
      low: formatCurrency(low),
      mid: formatCurrency(adjusted),
      high: formatCurrency(high)
    };
  }, [role, experience, location]);

  return (
    <div className="salary-calculator">
      <h3>AI Salary Calculator</h3>
      <p>
        Estimate a competitive salary range using aggregated market data. Pair with Interview Pass
        AI&apos;s recruiter outreach to negotiate with confidence.
      </p>
      <div className="calculator-grid">
        <label>
          Role
          <select value={role} onChange={(event) => setRole(event.target.value)}>
            {Object.keys(baseSalaries).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label>
          Experience Level
          <select
            value={experience}
            onChange={(event) => setExperience(event.target.value as ExperienceLevel)}
          >
            {(Object.keys(experienceMultipliers) as ExperienceLevel[]).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label>
          Location Tier
          <select
            value={location}
            onChange={(event) => setLocation(event.target.value as LocationTier)}
          >
            {(Object.keys(locationAdjustments) as LocationTier[]).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="estimate">
        <div>
          <span className="label">Estimated Range</span>
          <strong>
            {estimate.low} – {estimate.high}
          </strong>
        </div>
        <div>
          <span className="label">Midpoint</span>
          <strong>{estimate.mid}</strong>
        </div>
      </div>
    </div>
  );
}

export default SalaryCalculator;
