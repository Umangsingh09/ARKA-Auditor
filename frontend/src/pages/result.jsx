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
            <VulnerabilityCard
              key={i}
              title={item.title}
              severity={item.severity}
              description={item.description}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export default Results
