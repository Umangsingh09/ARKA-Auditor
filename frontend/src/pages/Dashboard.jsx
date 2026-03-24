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

  // Load existing scan if any
  useEffect(() => {
    const savedScanId = localStorage.getItem('arka_scan_id');
    if (savedScanId) {
      setScanId(savedScanId);
      checkScanStatus(savedScanId);
    }
  }, []);

  const checkScanStatus = async (id) => {
    try {
      const response = await axios.get(`http://localhost:8000/scan/status/${id}`);
      const data = response.data;

      setProgress(data.progress || 0);
      setStatus(data.status || 'unknown');

      if (data.status === 'complete') {
        setScanning(false);
        navigate(`/results/${id}`);
      } else if (data.status === 'error') {
        setScanning(false);
        setError(data.error || 'Scan failed');
      } else if (data.status !== 'error') {
        // Continue polling
        setTimeout(() => checkScanStatus(id), 2000);
      }
    } catch (err) {
      console.error('Status check failed:', err);
      setError('Failed to check scan status');
      setScanning(false);
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
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Security Dashboard</h1>
        <p className="text-slate-400">Scan your repository for vulnerabilities</p>
      </div>

      {/* Scan Input Form */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              GitHub Repository URL
            </label>
            <input
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/user/repo"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              disabled={scanning}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Target URL (for live scanning)
            </label>
            <input
              type="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="http://localhost:80"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              disabled={scanning}
            />
          </div>

          <button
            onClick={startScan}
            disabled={scanning}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            🚀 Start Security Scan
          </button>
        </div>
      </div>

      {/* Scan Progress */}
      {scanning && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-white mb-2">
              {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </h2>
            <div className="w-full bg-slate-700 rounded-full h-3 mb-2">
              <div
                className="bg-indigo-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-indigo-400 font-mono text-2xl">{progress}%</p>
          </div>

          {/* Status Steps */}
          <div className="flex justify-between items-center">
            {statusSteps.map((step, index) => (
              <div key={step.key} className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full mb-2 ${
                  step.done ? 'bg-green-500' :
                  step.active ? 'bg-indigo-500 animate-pulse' :
                  'bg-slate-600'
                }`}></div>
                <span className={`text-xs text-center ${
                  step.done ? 'text-green-400' :
                  step.active ? 'text-indigo-400' :
                  'text-slate-600'
                }`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4">
          <p className="text-red-400">Error: {error}</p>
        </div>
      )}
    </div>
  );
}
