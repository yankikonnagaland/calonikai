const express = require('express');
const path = require('path');

const app = express();
const PORT = 8081;

// Serve the mobile app files
app.use(express.static(path.join(__dirname, 'mobile')));

// Basic route to serve the mobile app
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Calonik Mobile Development</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            padding: 20px; 
            background: #0F172A; 
            color: white; 
            text-align: center;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 40px 20px;
          }
          .title { 
            font-size: 32px; 
            font-weight: bold; 
            margin-bottom: 20px; 
          }
          .subtitle { 
            font-size: 18px; 
            color: #94A3B8; 
            margin-bottom: 30px; 
          }
          .instructions {
            background: #1E293B;
            padding: 20px;
            border-radius: 8px;
            text-align: left;
            margin: 20px 0;
          }
          .code {
            background: #0F172A;
            padding: 10px;
            border-radius: 4px;
            font-family: monospace;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="title">Calonik.ai Mobile</div>
          <div class="subtitle">Smart Calorie Tracker - Development Server</div>
          
          <div class="instructions">
            <h3>To run Expo mobile app locally:</h3>
            <ol>
              <li>Download the mobile folder to your computer</li>
              <li>Install Expo CLI: <div class="code">npm install -g @expo/cli</div></li>
              <li>Navigate to mobile folder: <div class="code">cd mobile</div></li>
              <li>Install dependencies: <div class="code">npm install</div></li>
              <li>Start Expo: <div class="code">expo start</div></li>
              <li>Scan QR code with Expo Go app on your phone</li>
            </ol>
            
            <h3>Files to download:</h3>
            <ul>
              <li>mobile/App.js</li>
              <li>mobile/app.json</li>
              <li>mobile/eas.json</li>
              <li>mobile/package.json</li>
              <li>mobile/babel.config.js</li>
              <li>mobile/metro.config.js</li>
              <li>mobile/LOCAL_BUILD_GUIDE.md</li>
            </ul>
          </div>
          
          <p>Current mobile app status: Ready for local development</p>
          <p>For iOS build: Follow LOCAL_BUILD_GUIDE.md</p>
        </div>
      </body>
    </html>
  `);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Mobile development server running on port ${PORT}`);
  console.log(`Visit your Replit URL with :${PORT} to see mobile development instructions`);
});