import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Dashboard({ user }) {
  const navigate = useNavigate();
  const [repoUrl, setRepoUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState('http://localhost:80');
  const [scanning, setScanning] = useState(false);
  const [scanId, setScanId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Ready to scan');
  const [error, setError] = useState(null);

  const [url, setUrl] = useState("");
  const [scanResult, setScanResult] = useState("");

  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState("");

  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  // 🔹 AI Fix Generator
  const handleGenerateFix = async () => {
    if (!vulnerability) {
      alert("Please enter a vulnerability first");
      return;
    }

    if (!selectedRepo) {
      alert("Please select a repository first");
      return;
    }

    try {
      setLoading(true);
      console.log("🤖 GENERATE FIX: Starting fix generation for:", vulnerability);

      const repoUrl = `https://github.com/${selectedRepo}`;

      const response = await fetch("http://127.0.0.1:5000/generate-fix", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repo_url: repoUrl,
          vulnerability: vulnerability
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ GENERATE FIX: Fix generated successfully:", data);

      setFix(data.fix);
      alert("Fix generated successfully! 🤖");

    } catch (error) {
      console.error("❌ GENERATE FIX: Error generating fix:", error);

      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        alert("Cannot connect to backend server. Please make sure the Flask server is running on http://127.0.0.1:5000");
      } else {
        alert(`Error generating fix: ${error.message}`);
      }

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

      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        alert("Cannot connect to backend server. Please make sure the Flask server is running on http://127.0.0.1:5000");
      } else {
        alert(`Error scanning website: ${error.message}`);
      }

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
    }
  };

  // 🔥 ANALYZE REPO (FINAL FIX)
  const handleAnalyzeRepo = async () => {
    if (!selectedRepo) {
      alert("Select a repo first");
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("github_token");
      const repoUrl = `https://github.com/${selectedRepo}`;

      console.log("🔍 Analyzing repo:", repoUrl);

      const response = await fetch("http://127.0.0.1:5000/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repo_url: repoUrl,
          token: token || ""
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();

      console.log("✅ Analysis successful:", data);

      // Store analysis result in state
      setAnalysisResult(data);

      // Also set first issue as vulnerability for fix generation
      if (data.issues && data.issues.length > 0) {
        setVulnerability(data.issues[0]);
      }

      alert(data.message || `Analysis complete! Found ${data.issues?.length || 0} potential issues.`);

    } catch (error) {
      console.error("❌ Analysis error:", error);

      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        alert("Cannot connect to backend server. Please make sure the Flask server is running on http://127.0.0.1:5000");
      } else {
        alert(`Error analyzing repo: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // 🔹 CREATE PR
  const handleCreatePR = async () => {
    if (!selectedRepo) {
      alert("Please select a repository first");
      return;
    }

    if (!fix) {
      alert("Please generate a fix first");
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("github_token");
      const repoUrl = `https://github.com/${selectedRepo}`;

      console.log("🚀 Creating PR for:", repoUrl);

      const response = await fetch("http://127.0.0.1:5000/create-pr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repo_url: repoUrl,
          token: token,
          fix: fix
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();

      console.log("✅ PR created:", data.pr_url);
      alert(`PR Created Successfully! 🚀\n${data.pr_url}\n\nFiles modified: ${data.files_modified || 'N/A'}\nIssues fixed: ${data.issues_fixed || 'N/A'}`);

      // Open PR in new tab
      window.open(data.pr_url, '_blank');

    } catch (error) {
      console.error("❌ PR creation error:", error);

      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        alert("Cannot connect to backend server. Please make sure the Flask server is running on http://127.0.0.1:5000");
      } else {
        alert(`Error creating PR: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const startScan = async () => {
    if (!repoUrl.trim()) {
      setError('Please enter a GitHub repository URL');
      return;
    }

    setScanning(true);
    setProgress(0);
    setStatus('Starting scan...');
    setError(null);

    try {
      const response = await axios.post('http://localhost:8000/scan/start', {
        repo_url: repoUrl,
        target_url: targetUrl,
        github_token: user.access_token
      });

      const newScanId = response.data.scan_id;
      setScanId(newScanId);
      localStorage.setItem('arka_scan_id', newScanId);

      // Start polling
      checkScanStatus(newScanId);
    } catch (err) {
      console.error('Scan start failed:', err);
      setScanning(false);
      setError(err.response?.data?.detail || 'Failed to start scan');
    }
  };

  const getStatusStep = (currentStatus) => {
    const steps = [
      { key: 'cloning', label: 'Cloning' },
      { key: 'static_scan', label: 'Static Scan' },
      { key: 'live_scan', label: 'Live Scan' },
      { key: 'ai_analysis', label: 'AI Analysis' },
      { key: 'generating_fixes', label: 'Generating Fixes' }
    ];

    return steps.map(step => ({
      ...step,
      active: currentStatus === step.key,
      done: ['complete', 'generating_fixes', 'ai_analysis', 'live_scan', 'static_scan'].includes(currentStatus) &&
            steps.findIndex(s => s.key === currentStatus) >= steps.findIndex(s => s.key === step.key)
    }));
  };

  const statusSteps = getStatusStep(status);

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
          <p className="mt-2 text-green-600">
            Selected Repo: {selectedRepo}
          </p>
        )}

        <pre className="mt-3 text-sm">{scanResult}</pre>
      </div>

      {/* 🔥 ANALYZE BUTTON */}
      <button
        onClick={handleAnalyzeRepo}
        className="px-4 py-2 bg-yellow-500 text-white rounded w-full mb-3"
      >
        {loading ? "Analyzing..." : "Analyze Repo 🤖"}
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

      {/* OUTPUT */}
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-2">Result:</h2>

        {analysisResult ? (
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-blue-800 font-medium">{analysisResult.message}</p>
            </div>

            <div className="bg-gray-900 text-green-400 p-3 rounded text-sm">
              <h3 className="text-white font-semibold mb-2">Security Issues Found:</h3>
              {analysisResult.issues && analysisResult.issues.length > 0 ? (
                <ul className="space-y-1">
                  {analysisResult.issues.map((issue, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-red-400 mr-2">⚠️</span>
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-green-400">No security issues found! 🎉</p>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-gray-900 text-green-400 p-3 rounded text-sm">
            {fix || "No data yet... Run analysis to see results."}
          </div>
        )}
      </div>

    </div>
  );
}

export default Dashboard;
