import { useNavigate } from "react-router-dom"

function Home() {
  const navigate = useNavigate()

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-6">
        AI Code Security Auditor
      </h1>

      <button
        onClick={() => navigate("/dashboard")}
        className="px-6 py-3 bg-blue-600 rounded-xl hover:bg-blue-700"
      >
        Connect GitHub
      </button>
    </div>
  )
}

export default Home