import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"

function Login() {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      exit={{ opacity: 0, translateY: -20 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="min-h-screen bg-gradient-to-b from-[#02030f] via-[#070e29] to-[#0f1d3c] text-white flex items-center justify-center px-4"
    >
      <div className="w-full max-w-md text-center">
        <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-tight mb-4">AI Security Auditor</h1>
        <p className="text-slate-300 text-lg md:text-xl mb-10">Automate & secure your codebase</p>

        <button
          onClick={() => navigate("/dashboard")}
          className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 rounded-xl border border-blue-400/40 font-semibold text-lg transition-all duration-200 shadow-lg shadow-blue-500/30"
        >
          <span className="text-2xl">🐙</span>
          Continue with GitHub
        </button>
      </div>
    </motion.div>
  )
}

export default Login