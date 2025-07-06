const sharp = require('sharp');
const path = require('path');

async function createSquareIcon() {
  try {
    // Create a 1024x1024 square icon from the existing logo
    await sharp('assets/calonik-logo.png')
      .resize(1024, 1024, {
        fit: 'contain',
        background: { r: 15, g: 23, b: 42, alpha: 1 } // Dark blue background matching app theme
      })
      .png()
      .toFile('assets/icon.png');
    
    console.log('Square icon created successfully!');
  } catch (error) {
    console.error('Error creating square icon:', error);
  }
}

createSquareIcon();