import React, { useEffect, useState } from 'react';

export default function ExpoPage() {
  const [qrCode, setQrCode] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Generate QR code on client side
    const generateQRCode = async () => {
      try {
        // Import QRCode dynamically to avoid SSR issues
        const QRCode = await import('qrcode');
        
        const REPLIT_URL = window.location.origin;
        const EXPO_URL = `exp://${REPLIT_URL.replace('https://', '').replace('http://', '')}:19000`;
        
        const qrCodeDataURL = await QRCode.toDataURL(EXPO_URL);
        setQrCode(qrCodeDataURL);
        setLoading(false);
      } catch (error) {
        console.error('Error generating QR code:', error);
        setLoading(false);
      }
    };

    generateQRCode();
  }, []);

  const REPLIT_URL = window.location.origin;
  const EXPO_URL = `exp://${REPLIT_URL.replace('https://', '').replace('http://', '')}:19000`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Calonik.ai Mobile
          </h1>
          <p className="text-xl text-slate-300">Expo Development Interface</p>
        </div>

        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-8 text-center">
          <p className="text-green-400">✅ Mobile Development Environment Ready</p>
        </div>

        <div className="text-center mb-8">
          {loading ? (
            <div className="bg-white rounded-2xl p-8 inline-block">
              <div className="w-72 h-72 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 inline-block shadow-2xl">
              <img 
                src={qrCode} 
                alt="Expo QR Code" 
                className="w-72 h-72"
              />
            </div>
          )}
        </div>

        <div className="bg-blue-500/10 rounded-lg p-6 mb-8 font-mono text-sm break-all">
          <p><strong>Expo URL:</strong></p>
          <p className="text-blue-400">{EXPO_URL}</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-slate-700">
          <h3 className="text-2xl font-semibold mb-6">📱 How to Test on Your Phone:</h3>
          
          <div className="space-y-4">
            <div className="bg-slate-900/50 rounded-lg p-4 border-l-4 border-blue-500">
              <h4 className="font-semibold mb-2">1. Install Expo Go App</h4>
              <p className="text-slate-300">Download "Expo Go" from App Store (iOS) or Google Play (Android)</p>
            </div>
            
            <div className="bg-slate-900/50 rounded-lg p-4 border-l-4 border-blue-500">
              <h4 className="font-semibold mb-2">2. Scan QR Code</h4>
              <p className="text-slate-300">Open Expo Go app and scan the QR code above</p>
            </div>
            
            <div className="bg-slate-900/50 rounded-lg p-4 border-l-4 border-blue-500">
              <h4 className="font-semibold mb-2">3. Test the App</h4>
              <p className="text-slate-300">Your Calonik mobile app will load on your phone for testing</p>
            </div>
          </div>

          <h3 className="text-2xl font-semibold mt-8 mb-6">💻 Alternative Methods:</h3>
          
          <div className="space-y-4">
            <div className="bg-slate-900/50 rounded-lg p-4 border-l-4 border-purple-500">
              <h4 className="font-semibold mb-2">Local Development:</h4>
              <p className="text-slate-300">Download the mobile folder and run: </p>
              <code className="bg-slate-900 px-3 py-1 rounded text-green-400 text-sm">
                npm install && expo start
              </code>
            </div>
            
            <div className="bg-slate-900/50 rounded-lg p-4 border-l-4 border-purple-500">
              <h4 className="font-semibold mb-2">Direct URL:</h4>
              <p className="text-slate-300">Type the Expo URL above into Expo Go app manually</p>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <a 
            href="/" 
            className="inline-block px-6 py-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors"
          >
            ← Back to Web App
          </a>
        </div>

        <div className="text-center mt-8 text-slate-500 text-sm">
          Mobile app ready for iOS App Store submission with EAS configuration
        </div>
      </div>
    </div>
  );
}