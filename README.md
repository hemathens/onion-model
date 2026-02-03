# Onion Shelf Life Prediction System

An AI-powered web application for predicting onion shelf life using image analysis with a custom-trained deep learning model.

## Features

- 📷 **Webcam Integration**: Real-time onion quality assessment using your webcam
- 📁 **Image Upload**: Upload and analyze onion images for shelf life prediction
- 🖱️ **Drag & Drop**: Simply drag and drop onion images for instant analysis
- 📊 **Visual Feedback**: Color-coded prediction confidence scores
- 🎯 **Responsive Design**: Works on desktop and mobile devices
- 🧅 **Custom AI Model**: Trained specifically for onion shelf life prediction

## Setup Instructions

### 1. Model Files

Your custom-trained TensorFlow.js model should already be in the `my_model` folder with these files:
- `model.json` - Model architecture
- `metadata.json` - Class labels and metadata
- `weights.bin` - Trained model weights

### 2. Run the Application

#### Option 1: Using Python (Recommended)
```bash
# Navigate to the project folder
cd d:\Hem\onionmodel

# Start a simple HTTP server
python -m http.server 8000

# Open your browser and go to:
# http://localhost:8000
```

#### Option 2: Using Node.js
```bash
# Install a simple HTTP server globally
npm install -g http-server

# Navigate to the project folder
cd d:\Hem\onionmodel

# Start the server
http-server

# Open the URL shown in terminal (usually http://localhost:8080)
```

#### Option 3: Using Live Server (VS Code Extension)
1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

## How to Use

### Webcam Analysis
1. Click "Start Webcam" button
2. Allow browser access to your camera
3. Point your camera at onions to get real-time shelf life predictions
4. Click "Stop Webcam" when done

### Image Upload Analysis
1. Click "Choose File" or drag and drop an onion image
2. The image will be processed and analyzed automatically
3. View the shelf life prediction results below

## Onion Shelf Life Prediction Parameters

The system uses a **4-class classification model** to predict onion shelf life based on visual analysis:

### Classification System:

**Class 0 - Severe Spoilage (0 days)**
- Heavy sprouting (15%+ green pixels)
- Extensive dark spots/rot (35%+ dark pixels)
- Very dark appearance (brightness < 50)
- **Prediction: Exactly 0 days**
- Discard immediately

**Class 5-10 - Bad Condition (5-10 days)**
- Moderate sprouting (8-15% green pixels)
- Significant dark spots (20-35% dark pixels)
- Dark appearance (brightness 50-70)
- **Prediction: Random number between 5 and 10 days**
- Use within 1 week

**Class 15-19 - Fair Condition (15-19 days)**
- Light sprouting (3-8% green pixels)
- Moderate dark spots (10-20% dark pixels)
- Below average brightness (70-100)
- Low saturation (< 22%)
- **Prediction: Random number between 15 and 19 days**
- Use within 2-3 weeks

**Class 29-37 - Excellent Condition (29-37 days)**
- No visible spoilage
- Good brightness (100+)
- Good saturation (22%+)
- Optimal onion colors
- **Prediction: Random number between 29 and 37 days**
- Long-term storage (1+ month)

### Image Capture Best Practices:

For accurate predictions, ensure:
- Good lighting (natural or bright white light)
- Clear focus on the onion
- Capture multiple angles if possible
- Clean background for better detection
- Show the entire onion or the most representative area

## Customization

### Changing the Model Path
Edit the `MODEL_URL` variable in `app.js`:
```javascript
const MODEL_URL = "./path-to-your-model/";
```

### Styling
Modify the CSS in `index.html` to customize the appearance.

### Adjusting Prediction Display
Edit the prediction confidence thresholds in `app.js`:
- High confidence: > 70%
- Medium confidence: 30-70%
- Low confidence: < 30%

## Troubleshooting

### Common Issues

**Model not loading:**
- Make sure model files are in the correct `my_model` folder
- Check that file names match exactly: `model.json`, `metadata.json`
- Ensure you're running the app through a web server (not file:// protocol)

**Webcam not working:**
- Check browser permissions for camera access
- Make sure you're using HTTPS or localhost
- Try a different browser

**Predictions not accurate:**
- Ensure good lighting conditions
- Use clear, focused images
- Check that the onion is the main subject in the frame
- Verify model was trained with similar image conditions

### Browser Compatibility

- Chrome/Chromium: Full support
- Firefox: Full support
- Safari: Full support
- Edge: Full support

### Performance Tips

- Use images with good lighting for best results
- Ensure onions are clearly visible and in focus
- Models work best with images similar to training data
- For webcam use, hold onion steady for 1-2 seconds

## Technical Details

- Built with vanilla HTML, CSS, and JavaScript
- Uses TensorFlow.js for model inference
- Custom-trained CNN model for onion quality assessment
- No backend required - runs entirely in the browser
- Real-time image processing and prediction

## License

This project is open source and available under the MIT License.