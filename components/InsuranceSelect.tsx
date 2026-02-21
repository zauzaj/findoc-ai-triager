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
      <label
        htmlFor={id}
        className="block text-sm font-medium text-text-primary mb-1"
      >
        Insurance provider <span className="text-text-muted font-normal">(optional)</span>
      </label>
      <select
        id={id}
        name="insurance"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm text-text-primary focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-soft-blue"
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
