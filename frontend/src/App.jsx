import React, { useState } from "react";

function App() {
  const [result, setResult] = useState([]);
  const [loading, setLoading] = useState(false);

  const scan = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/fix", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify([
          {
            type: "SQL Injection",
            file: "login.py",
            severity: "HIGH"
          }
        ])
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult([{ error: "Error: " + err.message }]);
    } finally {
      setLoading(false);
    }
  };

  const getPriority = (severity) => {
    switch (severity) {
      case "HIGH": return 1;
      case "MEDIUM": return 2;
      case "LOW": return 3;
      default: return 4;
    }
  };

  const sortedResult = result.sort((a, b) => getPriority(a.severity) - getPriority(b.severity));

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>ARKA Auditor</h1>
      <p>AI-Powered Vulnerability Fix Generator</p>

      <button onClick={scan} disabled={loading} style={{ padding: "10px 20px", fontSize: "16px" }}>
        {loading ? "Scanning..." : "Scan"}
      </button>

      {sortedResult.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h2>Fixes Generated:</h2>
          {sortedResult.map((fix, index) => (
            <div key={index} style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "10px", borderRadius: "5px" }}>
              {fix.error ? (
                <p style={{ color: "red" }}>{fix.error}</p>
              ) : (
                <>
                  <h3>{fix.vulnerability} in {fix.file} (Severity: {fix.severity})</h3>
                  <p><strong>Fix:</strong></p>
                  <pre style={{ backgroundColor: "#f4f4f4", padding: "10px", borderRadius: "3px" }}>{fix.fix}</pre>
                  <p><strong>Explanation:</strong> {fix.explanation}</p>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;