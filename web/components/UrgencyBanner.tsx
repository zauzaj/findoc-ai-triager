import { getUrgencyConfig } from '@/lib/utils'

interface UrgencyBannerProps {
  urgency: string
}

export default function UrgencyBanner({ urgency }: UrgencyBannerProps) {
  const config = getUrgencyConfig(urgency)

  return (
    <div
      role="alert"
      className={`rounded border px-4 py-3 text-sm ${config.color}`}
      aria-label={`Urgency level: ${config.label}`}
    >
      <span className="font-semibold">{config.label}. </span>
      <span>{config.description}</span>
    </div>
  )
}
