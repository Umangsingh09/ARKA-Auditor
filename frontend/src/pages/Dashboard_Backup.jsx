import { useState } from "react";
import API from "../services/api";

function Dashboard() {
  const [vulnerability, setVulnerability] = useState("");
  const [fix, setFix] = useState("");

  const [url, setUrl] = useState("");
  const [scanResult, setScanResult] = useState("");

  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState("");

  const [loading, setLoading] = useState(false);

  // 🔥 ANALYZE REPO STATE
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [issues, setIssues] = useState([]);
  const [fixes, setFixes] = useState([]);
  const [analyzeError, setAnalyzeError] = useState("");
  const [analyzeSuccess, setAnalyzeSuccess] = useState(false);

  // 🔹 AI Fix Generator
  const handleGenerateFix = async () => {
    if (!vulnerability) return alert("Enter vulnerability");

    try {
      setLoading(true);
      const response = await API.post('/api/generate-fix', { vulnerability });
      setFix(response.data.fix);
    } catch (error) {
      console.error(error);
      setFix("Error generating fix");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Website Scanner
  const handleScanWebsite = async () => {
    if (!url) return alert("Enter website URL");

    try {
      setLoading(true);
      const response = await API.post('/api/scan', { url });
      setScanResult(response.data.result);
    } catch (error) {
      console.error(error);
      setScanResult("Error scanning website");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Fetch GitHub Repos
  const fetchRepos = async () => {
    try {
      const token = localStorage.getItem("github_token");

      if (!token) {
        alert("GitHub token not found. Please login again.");
        return;
      }

      const res = await fetch("https://api.github.com/user/repos", {
        headers: {
          Authorization: `token ${token}`,
        },
      });

      const data = await res.json();
      setRepos(data);
    } catch (error) {
      console.error("Error fetching repos:", error);
      alert("Error fetching repos. Check your GitHub token.");
    }
  };

  // 🔥 ANALYZE REPO (SIMPLIFIED & ROBUST VERSION)
  const handleAnalyzeRepo = async () => {
    // Reset states immediately
    setAnalyzeError("");
    setAnalyzeSuccess(false);
    setIssues([]);
    setFixes([]);
    setAnalyzeLoading(true);

    if (!selectedRepo) {
      setAnalyzeError("Please select a repository first");
      setAnalyzeLoading(false);
      return;
    }

    try {
      console.log("📤 Starting analysis for:", selectedRepo);

      const response = await API.post('/api/analyze-repo', { repo: selectedRepo });

      console.log("✅ Raw response:", response);
      console.log("✅ Response data:", response.data);

      const data = response.data;

      // Ensure data exists
      if (!data) {
        console.error("No data in response");
        setAnalyzeError("No data received from server");
        setAnalyzeLoading(false);
        return;
      }

      console.log("📊 Response status:", data.status);
      console.log("📋 Issues:", data.issues);
      console.log("🔧 Fixes:", data.fixes);

      // Check if response has the expected structure
      if (data.status === "success") {
        // Extract arrays, ensuring they are arrays
        const issuesArray = Array.isArray(data.issues) ? data.issues : [];
        const fixesArray = Array.isArray(data.fixes) ? data.fixes : [];

        console.log("✅ Issues array:", issuesArray);
        console.log("✅ Fixes array:", fixesArray);

        // Update state
        setIssues(issuesArray);
        setFixes(fixesArray);
        setAnalyzeSuccess(true);
        setAnalyzeError("");

        console.log("✨ Analysis complete! Issues:", issuesArray.length);
      } else {
        console.warn("Unexpected status:", data.status);
        setAnalyzeError(data.message || "Unexpected response from server");
        setAnalyzeSuccess(false);
      }
    } catch (error) {
      console.error("❌ Error:", error);
      console.error("Error message:", error.message);
      console.error("Error response:", error.response);

      let errorMsg = "Failed to analyze repository";

      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.response?.statusText) {
        errorMsg = error.response.statusText;
      } else if (error.message) {
        errorMsg = error.message;
      }

      setAnalyzeError(errorMsg);
      setAnalyzeSuccess(false);
    } finally {
      setAnalyzeLoading(false);
      console.log("🏁 Analysis finished");
    }
  };

  // 🔹 CREATE PR
  const handleCreatePR = async () => {
    try {
      const token = localStorage.getItem("github_token");

      if (!selectedRepo) {
        alert("Please select a repository first");
        return;
      }

      await API.post("/api/create-pr", {
        repo: selectedRepo,
        token: token,
        fix: fix || "AI generated fix"
      });

      alert("PR Created Successfully 🚀");

    } catch (error) {
      console.error(error);
      alert("Error creating PR");
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      <h1 className="text-3xl font-bold text-center mb-6">
        🚀 AI Security Dashboard
      </h1>

      {/* 🌐 WEBSITE SCANNER */}
      <div className="bg-white p-4 rounded-xl shadow mb-6">
        <h2 className="text-lg font-semibold mb-2">🌐 Scan Website</h2>

        <input
          type="text"
          placeholder="Enter website URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full p-2 border rounded mb-3"
        />

        <button
          onClick={handleScanWebsite}
          className="px-4 py-2 bg-green-600 text-white rounded w-full"
        >
          {loading ? "Scanning..." : "Scan Website 🔍"}
        </button>

        {/* Fetch repos */}
        <button
          onClick={fetchRepos}
          className="px-4 py-2 bg-black text-white rounded w-full mt-3"
        >
          Fetch GitHub Repos 📂
        </button>

        {/* Repo list */}
        <div className="mt-3 text-sm">
          {repos.length > 0 ? (
            repos.map((repo) => (
              <div
                key={repo.id}
                onClick={() => setSelectedRepo(repo.full_name)}
                className={`border p-2 mb-1 rounded cursor-pointer ${
                  selectedRepo === repo.full_name ? "bg-green-200" : ""
                }`}
              >
                {repo.name}
              </div>
            ))
          ) : (
            "No repos fetched yet..."
          )}
        </div>

        {selectedRepo && (
          <p className="mt-2 text-green-600 font-semibold">
            ✅ Selected Repo: {selectedRepo}
          </p>
        )}

        <pre className="mt-3 text-sm">{scanResult}</pre>
      </div>

      {/* 🔥 ANALYZE BUTTON */}
      <button
        onClick={handleAnalyzeRepo}
        disabled={analyzeLoading}
        className={`px-4 py-2 text-white rounded w-full mb-3 font-semibold transition ${
          analyzeLoading 
            ? "bg-gray-400 cursor-not-allowed" 
            : "bg-yellow-500 hover:bg-yellow-600"
        }`}
      >
        {analyzeLoading ? "⏳ Analyzing Repository..." : "Analyze Repo 🤖"}
      </button>

      {/* 🤖 GENERATE FIX */}
      <div className="bg-white p-4 rounded-xl shadow mb-4">
        <h2 className="text-lg font-semibold mb-2">🤖 Generate Fix</h2>

        <input
          type="text"
          placeholder="Enter vulnerability"
          value={vulnerability}
          onChange={(e) => setVulnerability(e.target.value)}
          className="w-full p-2 border rounded mb-3"
        />

        <button
          onClick={handleGenerateFix}
          className="px-4 py-2 bg-blue-600 text-white rounded w-full"
        >
          Generate Fix 🤖
        </button>
      </div>

      {/* CREATE PR */}
      <button
        onClick={handleCreatePR}
        className="px-4 py-2 bg-purple-600 text-white rounded w-full mb-4"
      >
        Create PR 🚀
      </button>

      {/* ========== RESULTS SECTION ========== */}
      <div className="bg-white p-4 rounded-xl shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">📊 Analysis Results:</h2>

        {/* LOADING STATE */}
        {analyzeLoading && (
          <div className="text-center p-6 bg-yellow-50 rounded">
            <div className="animate-spin inline-block w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full mb-3"></div>
            <p className="text-yellow-700 font-semibold">Processing repository...</p>
          </div>
        )}

        {/* ERROR STATE */}
        {!analyzeLoading && analyzeError && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
            <p className="font-semibold text-lg">❌ Error</p>
            <p className="mt-2">{analyzeError}</p>
          </div>
        )}

        {/* SUCCESS STATE - NO VULNERABILITIES */}
        {!analyzeLoading && analyzeSuccess && issues.length === 0 && !analyzeError && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded">
            <p className="font-semibold text-lg">✅ No vulnerabilities found</p>
            <p className="mt-2">Repository appears to be secure!</p>
          </div>
        )}

        {/* SUCCESS STATE - VULNERABILITIES FOUND */}
        {!analyzeLoading && analyzeSuccess && issues.length > 0 && !analyzeError && (
          <div className="space-y-4">
            {/* VULNERABILITIES/ISSUES */}
            <div>
              <h3 className="font-semibold text-red-600 mb-3 text-base">
                ⚠️ Vulnerabilities Found ({issues.length}):
              </h3>
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <ul className="list-disc list-inside space-y-2">
                  {issues.map((issue, index) => (
                    <li key={index} className="text-red-700">
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* FIXES */}
            {fixes.length > 0 && (
              <div>
                <h3 className="font-semibold text-blue-600 mb-3 text-base">
                  🔧 Recommended Fixes ({fixes.length}):
                </h3>
                <div className="bg-blue-50 border border-blue-200 rounded p-4">
                  <ul className="list-disc list-inside space-y-2">
                    {fixes.map((fixItem, index) => (
                      <li key={index} className="text-blue-700">
                        {fixItem}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* LEGACY FIX OUTPUT */}
        {!analyzeLoading && fix && !analyzeSuccess && (
          <div className="bg-gray-900 text-green-400 p-4 rounded text-sm overflow-auto max-h-64">
            <pre className="whitespace-pre-wrap font-mono">{fix}</pre>
          </div>
        )}

        {/* EMPTY STATE */}
        {!analyzeLoading && !analyzeSuccess && !analyzeError && issues.length === 0 && !fix && (
          <div className="text-center p-6 bg-gray-50 rounded text-gray-600">
            <p className="text-base">👉 Select a repository above and click "Analyze Repo" to scan for vulnerabilities</p>
          </div>
        )}
      </div>

    </div>
  );
}

export default Dashboard;
