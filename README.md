# Teachable Machine Image Classifier

A minimal frontend web application for running Teachable Machine image classification models.

## Features

- 📷 **Webcam Integration**: Real-time image classification using your webcam
- 📁 **Image Upload**: Upload and classify static images
- 🖱️ **Drag & Drop**: Simply drag and drop images for classification
- 📊 **Visual Feedback**: Color-coded confidence scores
- 🎯 **Responsive Design**: Works on desktop and mobile devices

## Setup Instructions

### 1. Get Your Teachable Machine Model

1. Go to [Teachable Machine](https://teachablemachine.withgoogle.com/)
2. Create an Image Project
3. Train your model with your images
4. Export your model:
   - Click "Export Model"
   - Choose "TensorFlow.js"
   - Select "Download my model"

### 2. Setup Model Files

1. Extract the downloaded model files
2. Create a folder named `my_model` in this project directory
3. Copy these files into the `my_model` folder:
   - `model.json`
   - `metadata.json`
   - `weights.bin` (or similar weight files)

Your project structure should look like:
```
onionmodel/
├── index.html
├── app.js
├── README.md
└── my_model/
    ├── model.json
    ├── metadata.json
    └── weights.bin
```

### 3. Run the Application

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

### Webcam Classification
1. Click "Start Webcam" button
2. Allow browser access to your camera
3. Point your camera at objects to classify them in real-time
4. Click "Stop Webcam" when done

### Image Upload Classification
1. Click "Choose File" or drag and drop an image
2. The image will be processed and classified automatically
3. View the prediction results below

## Customization

### Changing the Model Path
Edit the `MODEL_URL` variable in `app.js`:
```javascript
const MODEL_URL = "./path-to-your-model/";
```

### Styling
Modify the CSS in `index.html` to customize the appearance.

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

**Predictions not showing:**
- Verify your model was trained with similar images
- Check browser console for error messages
- Ensure model files are not corrupted

### Browser Compatibility

- Chrome/Chromium: Full support
- Firefox: Full support
- Safari: Full support
- Edge: Full support

### Performance Tips

- Use images similar to your training data for best results
- Ensure good lighting for webcam classification
- Models work best with clear, well-lit images

## Technical Details

- Built with vanilla HTML, CSS, and JavaScript
- Uses TensorFlow.js for model inference
- Teachable Machine Image library for model loading
- No backend required - runs entirely in the browser

## License

This project is open source and available under the MIT License.