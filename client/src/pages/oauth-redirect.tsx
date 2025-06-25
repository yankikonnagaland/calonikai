import { useEffect } from "react";

export default function OAuthRedirect() {
  useEffect(() => {
    // Add a small delay to ensure the page loads completely
    const timer = setTimeout(() => {
      console.log("Redirecting to Google OAuth...");
      window.location.replace('/api/auth/google');
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-white">Redirecting to Google...</p>
        <p className="text-gray-400 text-sm mt-2">If you're not redirected automatically, please check your browser settings.</p>
      </div>
    </div>
  );
}