import { useEffect } from "react";

export default function OAuthCallback() {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    console.log('OAuth callback page loaded with params:', Object.fromEntries(urlParams));
    console.log('window.opener exists:', !!window.opener);
    console.log('window.opener.closed:', window.opener?.closed);
    
    if (urlParams.get('success') === 'true') {
      const email = urlParams.get('email');
      const token = urlParams.get('token');
      console.log('OAuth success detected, email:', email, 'token:', token);
      
      // Store token in localStorage for main window to access
      if (token) {
        console.log('Storing auth token in localStorage');
        localStorage.setItem('oauth_auth_token', token);
      }
      
      // Success - close popup and let parent window know
      if (window.opener && !window.opener.closed) {
        console.log('Sending success message to parent window');
        
        // Try multiple times to ensure message gets through
        const sendMessage = () => {
          try {
            window.opener.postMessage({ 
              type: 'GOOGLE_AUTH_SUCCESS', 
              email,
              token,
              timestamp: Date.now()
            }, window.location.origin);
            console.log('Success message sent with token');
          } catch (error) {
            console.error('Error sending message:', error);
          }
        };
        
        // Send immediately and with retries
        sendMessage();
        setTimeout(sendMessage, 100);
        setTimeout(sendMessage, 500);
        
        // Close after delay to ensure message is received
        setTimeout(() => {
          console.log('Closing popup window');
          window.close();
        }, 1500);
      } else {
        console.log('No window.opener, redirecting to home');
        // Fallback if not in popup - just redirect to home
        window.location.href = '/';
      }
    } else if (urlParams.get('error')) {
      console.log('OAuth error detected:', urlParams.get('error'));
      
      // Error - close popup and let parent window know
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ 
          type: 'GOOGLE_AUTH_ERROR', 
          error: urlParams.get('error') 
        }, window.location.origin);
        setTimeout(() => window.close(), 1000);
      } else {
        // Fallback if not in popup
        window.location.href = '/?error=' + urlParams.get('error');
      }
    } else {
      console.log('No success or error parameter, waiting...');
      // If no parameters yet, wait a moment and try again
      setTimeout(() => {
        window.location.reload();
      }, 2000);
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