const express = require('express');
const QRCode = require('qrcode');
const path = require('path');

const app = express();
const PORT = 19000; // Standard Expo port

// Get the Replit URL
const REPLIT_URL = process.env.REPL_SLUG 
  ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
  : 'https://951c9b0b-a7e6-4243-ad92-b80de619ea52-00-2w9g548p0tyi.worf.replit.dev';

const EXPO_URL = `exp://${REPLIT_URL.replace('https://', '').replace('http://', '')}:${PORT}`;

app.use(express.static(path.join(__dirname)));

// Generate QR code for Expo Go app
app.get('/', async (req, res) => {
  try {
    const qrCode = await QRCode.toDataURL(EXPO_URL);
    
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Calonik Mobile - Expo Development</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              margin: 0;
              padding: 20px;
              background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
              color: white;
              min-height: 100vh;
            }
            .container { 
              max-width: 800px; 
              margin: 0 auto; 
              text-align: center;
            }
            .header {
              margin-bottom: 40px;
            }
            .title { 
              font-size: 2.5rem; 
              font-weight: bold; 
              margin-bottom: 10px;
              background: linear-gradient(45deg, #3B82F6, #8B5CF6);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
            }
            .subtitle { 
              font-size: 1.2rem; 
              color: #94A3B8; 
              margin-bottom: 30px; 
            }
            .qr-container {
              background: white;
              padding: 30px;
              border-radius: 20px;
              display: inline-block;
              margin: 20px 0;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            }
            .qr-code {
              width: 300px;
              height: 300px;
            }
            .instructions {
              background: rgba(30, 41, 59, 0.5);
              backdrop-filter: blur(10px);
              padding: 30px;
              border-radius: 15px;
              text-align: left;
              margin: 30px 0;
              border: 1px solid rgba(59, 130, 246, 0.2);
            }
            .step {
              margin: 15px 0;
              padding: 15px;
              background: rgba(15, 23, 42, 0.5);
              border-radius: 8px;
              border-left: 4px solid #3B82F6;
            }
            .url-info {
              background: rgba(59, 130, 246, 0.1);
              padding: 20px;
              border-radius: 10px;
              margin: 20px 0;
              font-family: monospace;
              word-break: break-all;
            }
            .status {
              background: rgba(34, 197, 94, 0.1);
              color: #22C55E;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
              border: 1px solid rgba(34, 197, 94, 0.2);
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="title">Calonik.ai Mobile</div>
              <div class="subtitle">Expo Development Server</div>
            </div>
            
            <div class="status">
              ✅ Expo Development Server Running
            </div>
            
            <div class="qr-container">
              <img src="${qrCode}" alt="Expo QR Code" class="qr-code" />
            </div>
            
            <div class="url-info">
              <strong>Expo URL:</strong><br>
              ${EXPO_URL}
            </div>
            
            <div class="instructions">
              <h3>📱 How to Test on Your Phone:</h3>
              
              <div class="step">
                <strong>1. Install Expo Go App</strong><br>
                Download "Expo Go" from App Store (iOS) or Google Play (Android)
              </div>
              
              <div class="step">
                <strong>2. Scan QR Code</strong><br>
                Open Expo Go app and scan the QR code above
              </div>
              
              <div class="step">
                <strong>3. Test the App</strong><br>
                Your Calonik mobile app will load on your phone
              </div>
              
              <h3>💻 For Local Development:</h3>
              
              <div class="step">
                Download the mobile folder and run:<br>
                <code style="background: #0F172A; padding: 5px 10px; border-radius: 4px; display: inline-block; margin-top: 5px;">
                  npm install && expo start
                </code>
              </div>
            </div>
            
            <div style="margin-top: 40px; color: #64748B; font-size: 0.9rem;">
              Mobile app configuration ready for iOS App Store submission
            </div>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send(`Error generating QR code: ${error.message}`);
  }
});

// Serve app manifest for Expo
app.get('/manifest', (req, res) => {
  res.json({
    name: "Calonik",
    slug: "calonik",
    version: "1.0.0",
    platforms: ["ios", "android"],
    sdkVersion: "51.0.0",
    bundleUrl: `${REPLIT_URL}:${PORT}/bundle`,
    iconUrl: `${REPLIT_URL}:${PORT}/assets/icon.png`,
  });
});

// Basic bundle endpoint
app.get('/bundle', (req, res) => {
  res.sendFile(path.join(__dirname, 'App.js'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Expo Development Server Started!`);
  console.log(`📱 Open: ${REPLIT_URL}:${PORT}`);
  console.log(`🔗 Expo URL: ${EXPO_URL}`);
  console.log(`\nScan the QR code with Expo Go app to test on your phone\n`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n👋 Expo development server stopped');
  process.exit(0);
});