import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'

export default function VerifiedPage() {
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          navigate('/login')
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [navigate])

  return (
    <div className="min-h-screen bg-[#0f0f14] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-600/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md text-center animate-fade-in">
        {/* Success icon */}
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
          <CheckCircle size={40} className="text-emerald-400" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          Email Verified! 🎉
        </h1>
        <p className="text-[#5a5a7a] mb-6">
          Your account has been successfully verified. You can now sign in.
        </p>

        <div className="card p-4 mb-6">
          <p className="text-sm text-[#7a7a9a]">
            Redirecting to login in{' '}
            <span className="text-brand-400 font-bold text-lg">{countdown}</span>
            {' '}seconds...
          </p>
          {/* Countdown bar */}
          <div className="h-1 bg-[#2a2a3d] rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all duration-1000"
              style={{ width: `${(countdown / 5) * 100}%` }}
            />
          </div>
        </div>

        <button
          onClick={() => navigate('/login')}
          className="btn-primary w-full"
        >
          Go to Login Now
        </button>
      </div>
    </div>
  )
}