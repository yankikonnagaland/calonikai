import { useEffect } from "react";

export default function OAuthCallback() {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    console.log('OAuth callback page loaded with params:', Object.fromEntries(urlParams));
    
    if (urlParams.get('success') === 'true') {
      const email = urlParams.get('email');
      console.log('OAuth success detected, email:', email);
      
      // Success - close popup and let parent window know
      if (window.opener && !window.opener.closed) {
        console.log('Sending success message to parent window');
        
        // Try multiple times to ensure message gets through
        const sendMessage = () => {
          try {
            window.opener.postMessage({ 
              type: 'GOOGLE_AUTH_SUCCESS', 
              email,
              timestamp: Date.now()
            }, window.location.origin);
            console.log('Success message sent');
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