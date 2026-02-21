interface SpecialistCardProps {
  specialist: string
  explanation: string
  confidence: number
}

export default function SpecialistCard({
  specialist,
  explanation,
  confidence,
}: SpecialistCardProps) {
  const confidencePercent = Math.round(confidence * 100)

  return (
    <div className="bg-white rounded border border-gray-100 p-6">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1">
            Recommended specialist
          </p>
          <h2 className="text-xl font-semibold text-text-primary">{specialist}</h2>
        </div>
        <div
          className="flex-shrink-0 text-right"
          aria-label={`Confidence: ${confidencePercent}%`}
        >
          <p className="text-xs text-text-muted mb-1">Confidence</p>
          <p className="text-sm font-medium text-primary-blue">{confidencePercent}%</p>
        </div>
      </div>

      <p className="text-sm text-text-muted leading-relaxed">{explanation}</p>
    </div>
  )
}
