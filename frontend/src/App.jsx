import React, { useState } from "react";

function App() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const scan = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/fix", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          vulnerabilities: [
            {
              type: "SQL Injection",
              file: "login.py",
              severity: "HIGH",
              code: "cursor.execute(f\"SELECT * FROM users WHERE id = {user_id}\")"
            }
          ]
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      setResults([{ error: "Error: " + err.message }]);
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

  const sortedResults = results.sort((a, b) => getPriority(a.severity) - getPriority(b.severity));

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "HIGH": return "red";
      case "MEDIUM": return "orange";
      case "LOW": return "green";
      default: return "gray";
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>ARKA Auditor</h1>
      <p>AI-Powered Vulnerability Fix Generator</p>

      <button onClick={scan} disabled={loading} style={{ padding: "10px 20px", fontSize: "16px" }}>
        {loading ? "Scanning..." : "Scan"}
      </button>

      {sortedResults.length === 0 && !loading && (
        <p>No vulnerabilities found 🎉</p>
      )}

      {sortedResults.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h2>Fixes Generated:</h2>
          {sortedResults.map((result, index) => (
            <div key={index} style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "10px", borderRadius: "5px" }}>
              {result.error ? (
                <p style={{ color: "red" }}>{result.error}</p>
              ) : (
                <>
                  <h3>{result.type} <span style={{ color: getSeverityColor(result.severity), fontWeight: "bold" }}>({result.severity})</span></h3>
                  <p><strong>Fix:</strong> {result.fix}</p>
                  <p><strong>Confidence:</strong> {result.confidence}</p>
                  <p><strong>Explanation:</strong> {result.explanation}</p>
                  <div>
                    <h4>Before:</h4>
                    <pre style={{ backgroundColor: "#ffe6e6", padding: "10px", borderRadius: "3px" }}>{result.code || "No code provided"}</pre>
                    <h4>After:</h4>
                    <pre style={{ backgroundColor: "#e6ffe6", padding: "10px", borderRadius: "3px" }}>{result.fixed_code}</pre>
                  </div>
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