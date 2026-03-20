import { motion } from "framer-motion"
import VulnerabilityCard from "../components/VulnerabilityCard"

function Results() {
  const data = [
    {
      title: "SQL Injection",
      severity: "High",
      description: "Unsanitized user input in login function",
      risk: "Critical"
    },
    {
      title: "Cross-Site Scripting (XSS)",
      severity: "Medium",
      description: "Unescaped output in comment rendering",
      risk: "Moderate"
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="min-h-screen bg-[#071021] text-white px-6 py-8"
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Scan Results</h1>
          <div className="text-sm text-slate-400">Security Score: <span className="text-green-400">72/100</span></div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {data.map((item, i) => (
            <div key={i} className="bg-[#0f1730]/80 border border-slate-700 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold">{item.title}</h2>
                <span className={`px-3 py-1 text-xs rounded-full ${item.severity === "High" ? "bg-red-500/20 text-red-300" : "bg-amber-500/20 text-amber-300"}`}>
                  {item.severity}
                </span>
              </div>
              <p className="text-slate-300 mb-3">{item.description}</p>
              <p className="text-sm text-slate-400 mb-4">Risk: {item.risk}</p>
              <div className="flex gap-2">
                <button className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition">View Issue</button>
                <button className="flex-1 py-2 rounded-lg bg-green-600 hover:bg-green-500 transition">View PR</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export default Results
