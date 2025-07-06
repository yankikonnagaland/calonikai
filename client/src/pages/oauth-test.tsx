import { useEffect, useState } from "react";

export default function OAuthTest() {
  const [config, setConfig] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/google/test')
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(err => setError(err.message));
  }, []);

  const testDirectAuth = () => {
    window.open('/api/auth/google', '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Google OAuth Configuration Test</h1>
        
        {error && (
          <div className="bg-red-900 border border-red-600 rounded-lg p-4 mb-6">
            <p className="text-red-200">Error: {error}</p>
          </div>
        )}

        {config && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Configuration Status</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>OAuth Configured:</span>
                <span className={config.oauth_configured ? 'text-green-400' : 'text-red-400'}>
                  {config.oauth_configured ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Client ID Present:</span>
                <span className={config.client_id_present ? 'text-green-400' : 'text-red-400'}>
                  {config.client_id_present ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Client Secret Present:</span>
                <span className={config.client_secret_present ? 'text-green-400' : 'text-red-400'}>
                  {config.client_secret_present ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Environment:</span>
                <span className="text-blue-400">{config.environment}</span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-yellow-200">Required Callback URL</h2>
          <p className="text-yellow-100 mb-4">
            Add this exact URL to your Google Cloud Console OAuth 2.0 Client ID:
          </p>
          <div className="bg-gray-800 p-4 rounded border font-mono text-sm break-all">
            {config?.callback_url || 'Loading...'}
          </div>
          <p className="text-yellow-100 mt-4 text-sm">
            Go to: Google Cloud Console → APIs & Services → Credentials → Edit OAuth 2.0 Client ID → 
            Add to "Authorized redirect URIs"
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={testDirectAuth}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg"
          >
            Test Direct OAuth (Opens in New Tab)
          </button>
          
          <div className="text-center">
            <a href="/" className="text-blue-400 hover:text-blue-300">
              ← Back to App
            </a>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">Expected Error</h2>
          <p className="text-gray-300 mb-2">
            If the callback URL isn't registered, you'll see:
          </p>
          <div className="bg-red-900 p-3 rounded text-red-200 font-mono text-sm">
            Error 400: redirect_uri_mismatch
          </div>
        </div>
      </div>
    </div>
  );
}