import { useState } from "react";
import API from "../services/api";

function Dashboard() {
  const [vulnerability, setVulnerability] = useState("");
  const [fix, setFix] = useState("");

  const handleGenerateFix = async () => {
    if (!vulnerability) return;
    try {
      const response = await API.post('/api/generate-fix', { vulnerability });
      setFix(response.data.fix);
    } catch (error) {
      console.error("Error generating fix:", error);
      setFix("Error generating fix");
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">
        Vulnerability Dashboard
      </h1>

      <div className="bg-white p-4 rounded-xl shadow mb-4">
        <input
          type="text"
          placeholder="Enter vulnerability description"
          value={vulnerability}
          onChange={(e) => setVulnerability(e.target.value)}
          className="w-full p-2 border rounded mb-2"
        />
        <button
          onClick={handleGenerateFix}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Generate Fix
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-2">Generated Fix:</h2>
        <pre className="whitespace-pre-wrap">{fix || "No data yet..."}</pre>
      </div>
    </div>
  )
}

export default Dashboard