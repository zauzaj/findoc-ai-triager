'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { verifyMagicLink } from '@/lib/api'

function VerifyInner() {
  const router       = useRouter()
  const params       = useSearchParams()
  const { setAuth }  = useAuth()
  const [status, setStatus] = useState<'verifying' | 'error'>('verifying')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = params.get('token')
    if (!token) { setStatus('error'); setMessage('Missing token.'); return }

    verifyMagicLink(token)
      .then(({ token: jwt, user }) => {
        setAuth(jwt, user)
        router.replace('/profile')
      })
      .catch(() => {
        setStatus('error')
        setMessage('This link has expired or already been used. Please request a new one.')
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="max-w-sm mx-auto px-4 py-16 text-center">
      {status === 'verifying' ? (
        <>
          <div className="w-8 h-8 rounded-full border-2 border-primary-blue border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-text-muted text-sm">Signing you in…</p>
        </>
      ) : (
        <div className="bg-white rounded border-2 border-[#eef2f6] p-8 shadow-[0_4px_10px_rgba(67,95,113,0.08)]">
          <p className="text-emergency-red font-medium mb-2">Sign-in failed</p>
          <p className="text-sm text-text-muted mb-4">{message}</p>
          <a href="/auth/signin" className="text-sm text-primary-blue hover:underline">Try again</a>
        </div>
      )}
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-sm mx-auto px-4 py-16 text-center">
          <div className="w-8 h-8 rounded-full border-2 border-primary-blue border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-text-muted text-sm">Loading…</p>
        </div>
      }
    >
      <VerifyInner />
    </Suspense>
  )
}
