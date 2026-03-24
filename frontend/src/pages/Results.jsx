import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Results({ user }) {
  const { scanId } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creatingIssue, setCreatingIssue] = useState({});
  const [creatingPR, setCreatingPR] = useState({});
  const [issueLinks, setIssueLinks] = useState({});
  const [prLinks, setPrLinks] = useState({});

  useEffect(() => {
    fetchResults();
  }, [scanId]);

  const fetchResults = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/scan/results/${scanId}`);
      setResults(response.data);
    } catch (err) {
      console.error('Failed to fetch results:', err);
    } finally {
      setLoading(false);
    }
  };

  const createIssue = async (vulnId) => {
    if (creatingIssue[vulnId]) return;

    setCreatingIssue(prev => ({ ...prev, [vulnId]: true }));
    try {
      const vuln = results.vulnerabilities.find(v => v.id === vulnId);
      const response = await axios.post('http://localhost:8000/github/issue', {
        repo_full_name: results.repo_name,
        github_token: user.access_token,
        vulnerability: vuln
      });

      setIssueLinks(prev => ({
        ...prev,
        [vulnId]: {
          number: response.data.issue_number,
          url: response.data.issue_url
        }
      }));
    } catch (err) {
      console.error('Failed to create issue:', err);
      alert('Failed to create GitHub issue');
    } finally {
      setCreatingIssue(prev => ({ ...prev, [vulnId]: false }));
    }
  };

  const createPR = async (vulnId) => {
    if (creatingPR[vulnId] || !issueLinks[vulnId]) return;

    setCreatingPR(prev => ({ ...prev, [vulnId]: true }));
    try {
      const vuln = results.vulnerabilities.find(v => v.id === vulnId);
      const response = await axios.post('http://localhost:8000/github/pr', {
        repo_full_name: results.repo_name,
        github_token: user.access_token,
        vulnerability: vuln,
        fix_code: vuln.fix_code || '# Fix not available',
        issue_number: issueLinks[vulnId].number
      });

      setPrLinks(prev => ({
        ...prev,
        [vulnId]: {
          number: response.data.pr_number,
          url: response.data.pr_url
        }
      }));
    } catch (err) {
      console.error('Failed to create PR:', err);
      alert('Failed to create GitHub PR');
    } finally {
      setCreatingPR(prev => ({ ...prev, [vulnId]: false }));
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center text-white">Loading results...</div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center text-white">No results found</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Scan Results</h1>
        <p className="text-slate-400">Repository: {results.repo_name}</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-red-400">{results.critical}</div>
          <div className="text-sm text-red-300">Critical</div>
        </div>
        <div className="bg-orange-900/30 border border-orange-700 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-orange-400">{results.high}</div>
          <div className="text-sm text-orange-300">High</div>
        </div>
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-yellow-400">{results.medium}</div>
          <div className="text-sm text-yellow-300">Medium</div>
        </div>
        <div className="bg-blue-900/30 border border-blue-700 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-blue-400">{results.low}</div>
          <div className="text-sm text-blue-300">Low</div>
        </div>
      </div>

      {/* Vulnerability Cards */}
      <div className="space-y-4">
        {results.vulnerabilities.map((vuln) => (
          <div key={vuln.id} className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getSeverityColor(vuln.severity)}`}>
                    {vuln.severity}
                  </span>
                  <h3 className="text-lg font-semibold text-white">{vuln.type}</h3>
                </div>
                <p className="text-slate-300 text-sm mb-2">
                  {vuln.filename}
                  {vuln.line_number > 0 && `:${vuln.line_number}`}
                </p>
                <p className="text-slate-400 text-sm">{vuln.description}</p>
                {vuln.fix_suggestion && (
                  <p className="text-slate-500 text-sm italic mt-2">{vuln.fix_suggestion}</p>
                )}
              </div>
            </div>

            {vuln.fix_code && (
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 mb-4">
                <pre className="text-green-400 text-xs overflow-x-auto whitespace-pre-wrap">
                  {vuln.fix_code}
                </pre>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => createIssue(vuln.id)}
                disabled={creatingIssue[vuln.id]}
                className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {creatingIssue[vuln.id] ? 'Creating...' : 'Create Issue'}
                {issueLinks[vuln.id] && (
                  <a
                    href={issueLinks[vuln.id].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 underline ml-2"
                  >
                    #{issueLinks[vuln.id].number}
                  </a>
                )}
              </button>

              <button
                onClick={() => createPR(vuln.id)}
                disabled={creatingPR[vuln.id] || !issueLinks[vuln.id]}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {creatingPR[vuln.id] ? 'Creating PR...' : 'Create PR'}
                {prLinks[vuln.id] && (
                  <a
                    href={prLinks[vuln.id].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 underline ml-2"
                  >
                    #{prLinks[vuln.id].number}
                  </a>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {results.vulnerabilities.length === 0 && (
        <div className="text-center text-slate-400 py-12">
          No vulnerabilities found! 🎉
        </div>
      )}
    </div>
  );
}
