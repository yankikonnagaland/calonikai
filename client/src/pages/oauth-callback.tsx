import { useEffect } from "react";

export default function OAuthCallback() {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('success') === 'true') {
      // Success - close popup and let parent window know
      if (window.opener) {
        window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, window.location.origin);
        window.close();
      } else {
        // Fallback if not in popup
        window.location.href = '/';
      }
    } else if (urlParams.get('error')) {
      // Error - close popup and let parent window know
      if (window.opener) {
        window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: urlParams.get('error') }, window.location.origin);
        window.close();
      } else {
        // Fallback if not in popup
        window.location.href = '/?error=' + urlParams.get('error');
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-white">Processing authentication...</p>
        <p className="text-gray-400 text-sm mt-2">This window will close automatically.</p>
      </div>
    </div>
  );
}