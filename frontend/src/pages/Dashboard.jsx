import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import ProgressBar from "../components/ProgressBar"

function Dashboard() {
  const navigate = useNavigate()
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => navigate("/results"), 900)
          return 100
        }
        return prev + 8
      })
    }, 350)

    return () => clearInterval(interval)
  }, [navigate])

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen bg-[#070a14] text-white px-6 py-8"
    >
      <div className="max-w-5xl mx-auto grid gap-6 lg:grid-cols-3">

        <div className="lg:col-span-1 bg-[#0f172a]/80 border border-slate-700 rounded-3xl p-5 shadow-[0_16px_30px_-10px_rgba(0,0,0,0.5)] backdrop-blur">
          <h1 className="text-2xl font-bold mb-4">AI Security Auditor</h1>
          <p className="text-slate-300 text-sm mb-4">You're scanning: <span className="text-indigo-300">demo-repo</span></p>
          <p className="text-slate-300 text-sm">Next steps:</p>
          <ul className="mt-3 space-y-2 text-slate-300 text-sm">
            <li>• Review security score</li>
            <li>• Validate findings</li>
            <li>• Fix critical issues</li>
          </ul>
        </div>

        <div className="lg:col-span-2 bg-[#0f172a]/80 border border-slate-700 rounded-3xl p-6 shadow-[0_16px_30px_-10px_rgba(0,0,0,0.5)] backdrop-blur">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold">Audit Dashboard</h2>
            <span className="text-xs text-slate-400 uppercase tracking-wider">Live Scan</span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
              <div className="text-xs uppercase text-slate-400">Repository</div>
              <div className="text-lg font-bold">demo-repo</div>
            </div>
            <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
              <div className="text-xs uppercase text-slate-400">Status</div>
              <div className="text-lg font-bold text-blue-300">Scanning...</div>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-slate-300 mb-2">Scanning for vulnerabilities…</p>
            <ProgressBar progress={progress} />
            <p className="mt-2 text-sm text-slate-300">{progress}% completed</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
            <h3 className="text-sm text-slate-400 uppercase mb-1">Scan Log</h3>
            <ul className="text-slate-200 text-sm space-y-1">
              <li>• Connecting to GitHub API</li>
              <li>• Analyzing codebase patterns</li>
              <li>• Static & dynamic vulnerability checks</li>
            </ul>
          </div>

          <button
            onClick={() => navigate("/results")}
            className="mt-5 w-full rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white py-3 font-semibold transition"
          >
            Skip to Results
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default Dashboard