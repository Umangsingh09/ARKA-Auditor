import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function Landing({ onLogin }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check for OAuth callback params
    const token = searchParams.get('token');
    const username = searchParams.get('username');
    const avatarUrl = searchParams.get('avatar_url');
    const userId = searchParams.get('user_id');

    if (token && username && avatarUrl && userId) {
      onLogin({
        access_token: token,
        username,
        avatar_url: avatarUrl,
        user_id: userId
      });
      navigate('/dashboard');
    }
  }, [searchParams, onLogin, navigate]);

  const handleGitHubLogin = () => {
    window.location.href = 'http://localhost:8000/auth/github';
  };

  return (
    <div className="bg-slate-900 flex flex-col items-center justify-center min-h-[90vh] px-6">
      <div className="text-center max-w-4xl">
        <div className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-semibold mb-6">
          AI-Powered Security Scanner
        </div>

        <h1 className="text-5xl font-bold text-white mb-6">
          Ship Secure Code with Confidence
        </h1>

        <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
          Enterprise-grade security scanning powered by Bandit, OWASP ZAP, and GPT-4.
          Detect vulnerabilities, get AI-generated fixes, and create automated PRs.
        </p>

        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <span className="bg-slate-800 border border-slate-700 rounded-full px-4 py-2 text-sm">
            Bandit SAST
          </span>
          <span className="bg-slate-800 border border-slate-700 rounded-full px-4 py-2 text-sm">
            OWASP ZAP
          </span>
          <span className="bg-slate-800 border border-slate-700 rounded-full px-4 py-2 text-sm">
            GPT-4 Fixes
          </span>
          <span className="bg-slate-800 border border-slate-700 rounded-full px-4 py-2 text-sm">
            Auto PRs
          </span>
        </div>

        <button
          onClick={handleGitHubLogin}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all flex items-center gap-3 mx-auto"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          Continue with GitHub
        </button>

        <p className="text-slate-500 text-sm mt-4">
          Secured with GitHub OAuth
        </p>
      </div>
    </div>
  );
}
