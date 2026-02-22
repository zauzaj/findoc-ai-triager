export const metadata = {
  title: 'You\'re offline',
}

export default function OfflinePage() {
  return (
    <div className="max-w-sm mx-auto px-4 py-24 text-center">
      <div className="text-5xl mb-6">📡</div>
      <h1 className="text-xl font-semibold text-primary-blue mb-2">No internet connection</h1>
      <p className="text-sm text-text-muted mb-8 leading-relaxed">
        It looks like you&apos;re offline. Check your connection and try again — your recent searches and saved clinics are still available in your profile.
      </p>
      <a
        href="/"
        className="inline-block rounded bg-primary-orange px-6 py-3 text-sm font-semibold text-white hover:bg-primary-orange-hover transition-colors"
      >
        Try again
      </a>
    </div>
  )
}
