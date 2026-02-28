'use client'

import { INSURERS, Insurer } from '@/lib/constants'

interface InsuranceSelectProps {
  value: string
  onChange: (value: string) => void
  id?: string
}

export default function InsuranceSelect({
  value,
  onChange,
  id = 'insurance',
}: InsuranceSelectProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-slate-700">
        Insurance provider <span className="font-normal text-slate-500">(optional)</span>
      </label>
      <select
        id={id}
        name="insurance"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 shadow-sm focus:border-sky-300 focus:outline-none focus:ring-4 focus:ring-sky-100 transition"
        aria-label="Select your insurance provider"
      >
        <option value="">No insurance / pay privately</option>
        {INSURERS.map((insurer: Insurer) => (
          <option key={insurer} value={insurer}>
            {insurer}
          </option>
        ))}
      </select>
    </div>
  )
}
