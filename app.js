// Teachable Machine Image Model Configuration
// Update this URL to point to your model
const MODEL_URL = "./my_model/";

// Global variables
let model, webcam, labelContainer, maxPredictions;
let isWebcamRunning = false;

// DOM elements
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const statusDiv = document.getElementById('status');
const imageInput = document.getElementById('image-input');
const imagePreview = document.getElementById('image-preview');
const fileDropArea = document.getElementById('file-drop-area');

// Show status message
function showStatus(message, type = 'loading') {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
}

// Hide status message
function hideStatus() {
    statusDiv.style.display = 'none';
}

// Load the model
async function loadModel() {
    try {
        showStatus('Loading AI model...', 'loading');
        
        const modelURL = MODEL_URL + "model.json";
        const metadataURL = MODEL_URL + "metadata.json";
        
        // Check if model files exist first
        try {
            const modelResponse = await fetch(modelURL);
            const metadataResponse = await fetch(metadataURL);
            
            if (!modelResponse.ok) {
                throw new Error(`Model file not found: ${modelURL} (Status: ${modelResponse.status})`);
            }
            if (!metadataResponse.ok) {
                throw new Error(`Metadata file not found: ${metadataURL} (Status: ${metadataResponse.status})`);
            }
        } catch (fetchError) {
            console.error('Model file check failed:', fetchError);
            showStatus(`Error: Model files missing. Please add your Teachable Machine model files to the "my_model" folder. Details: ${fetchError.message}`, 'error');
            return false;
        }
        
        // Load the model and metadata
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();
        
        // Setup label container
        labelContainer = document.getElementById("label-container");
        labelContainer.innerHTML = ''; // Clear existing content
        
        for (let i = 0; i < maxPredictions; i++) {
            const div = document.createElement("div");
            div.innerHTML = "Waiting for prediction...";
            labelContainer.appendChild(div);
        }
        
        showStatus(`Model loaded successfully! 🎉 (${maxPredictions} classes detected)`, 'success');
        setTimeout(hideStatus, 2000);
        
        return true;
    } catch (error) {
        console.error('Error loading model:', error);
        if (error.message.includes('fetch')) {
            showStatus('Error: Network issue loading model. Make sure the server is running and model files exist.', 'error');
        } else if (error.message.includes('JSON')) {
            showStatus('Error: Invalid model format. Please check your model.json file.', 'error');
        } else {
            showStatus(`Error: Could not load model. ${error.message}`, 'error');
        }
        return false;
    }
}

// Initialize webcam
async function initWebcam() {
    try {
        // Load model first if not already loaded
        if (!model) {
            const modelLoaded = await loadModel();
            if (!modelLoaded) return;
        }
        
        showStatus('Setting up webcam...', 'loading');
        
        // Setup webcam
        const flip = true; // whether to flip the webcam
        webcam = new tmImage.Webcam(224, 224, flip); // width, height, flip
        await webcam.setup(); // request access to the webcam
        await webcam.play();
        
        // Add webcam canvas to DOM
        const webcamContainer = document.getElementById("webcam-container");
        webcamContainer.innerHTML = ''; // Clear existing content
        webcamContainer.appendChild(webcam.canvas);
        
        // Start prediction loop
        isWebcamRunning = true;
        window.requestAnimationFrame(loop);
        
        // Update button states
        startBtn.disabled = true;
        stopBtn.disabled = false;
        
        showStatus('Webcam started! 📸', 'success');
        setTimeout(hideStatus, 2000);
        
    } catch (error) {
        console.error('Error initializing webcam:', error);
        showStatus('Error: Could not access webcam. Please check permissions.', 'error');
    }
}

// Stop webcam
function stopWebcam() {
    if (webcam) {
        webcam.stop();
        isWebcamRunning = false;
        
        // Clear webcam container
        const webcamContainer = document.getElementById("webcam-container");
        webcamContainer.innerHTML = '';
        
        // Update button states
        startBtn.disabled = false;
        stopBtn.disabled = true;
        
        showStatus('Webcam stopped', 'success');
        setTimeout(hideStatus, 2000);
    }
}

// Prediction loop for webcam
async function loop() {
    if (isWebcamRunning && webcam) {
        webcam.update(); // update the webcam frame
        await predict(webcam.canvas);
        window.requestAnimationFrame(loop);
    }
}

// Run prediction on image/canvas
async function predict(imageElement) {
    if (!model) {
        console.error('Model not loaded');
        showStatus('Error: Model not loaded. Please load a model first.', 'error');
        return;
    }
    
    try {
        // Get prediction from model
        const prediction = await model.predict(imageElement);
        
        // Validate prediction results
        if (!prediction || prediction.length === 0) {
            throw new Error('Model returned empty predictions');
        }
        
        if (prediction.length !== maxPredictions) {
            console.warn(`Expected ${maxPredictions} predictions, got ${prediction.length}`);
        }
        
        // Update labels with predictions
        for (let i = 0; i < Math.min(prediction.length, maxPredictions); i++) {
            const probability = prediction[i].probability || 0;
            const className = prediction[i].className || `Class ${i + 1}`;
            const percentage = (probability * 100).toFixed(1);
            
            const classPrediction = `${className}: ${percentage}%`;
            const labelDiv = labelContainer.childNodes[i];
            if (labelDiv) {
                labelDiv.innerHTML = classPrediction;
                
                // Add styling based on confidence
                labelDiv.className = '';
                if (probability > 0.7) {
                    labelDiv.classList.add('prediction-high');
                } else if (probability > 0.3) {
                    labelDiv.classList.add('prediction-medium');
                } else {
                    labelDiv.classList.add('prediction-low');
                }
            }
        }
    } catch (error) {
        console.error('Error during prediction:', error);
        showStatus(`Error during prediction: ${error.message}`, 'error');
        
        // Show error in prediction labels
        for (let i = 0; i < maxPredictions && i < labelContainer.childNodes.length; i++) {
            labelContainer.childNodes[i].innerHTML = 'Prediction error';
            labelContainer.childNodes[i].className = 'prediction-low';
        }
    }
}

// Handle image upload
async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        await processUploadedFile(file);
    }
}

// Process uploaded file
async function processUploadedFile(file) {
    try {
        // Load model first if not already loaded
        if (!model) {
            const modelLoaded = await loadModel();
            if (!modelLoaded) return;
        }
        
        showStatus('Processing image...', 'loading');
        
        // Create image element
        const img = new Image();
        img.onload = async function() {
            // Show preview
            imagePreview.src = img.src;
            imagePreview.style.display = 'block';
            
            // Create canvas for prediction
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Resize image to 224x224 (model input size)
            canvas.width = 224;
            canvas.height = 224;
            ctx.drawImage(img, 0, 0, 224, 224);
            
            // Run prediction
            await predict(canvas);
            
            hideStatus();
        };
        
        img.onerror = function() {
            showStatus('Error: Could not load image', 'error');
        };
        
        // Load the image
        const reader = new FileReader();
        reader.onload = function(e) {
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
        
    } catch (error) {
        console.error('Error processing image:', error);
        showStatus('Error processing image', 'error');
    }
}

// Drag and drop functionality
fileDropArea.addEventListener('dragover', function(e) {
    e.preventDefault();
    fileDropArea.classList.add('dragover');
});

fileDropArea.addEventListener('dragleave', function(e) {
    e.preventDefault();
    fileDropArea.classList.remove('dragover');
});

fileDropArea.addEventListener('drop', function(e) {
    e.preventDefault();
    fileDropArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
            processUploadedFile(file);
        } else {
            showStatus('Please drop an image file', 'error');
        }
    }
});

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Teachable Machine Image Classifier loaded');
    showStatus('Ready! Load a model by starting webcam or uploading an image.', 'success');
    setTimeout(hideStatus, 3000);
});

// Error handling for uncaught errors
window.addEventListener('error', function(event) {
    console.error('Uncaught error:', event.error);
    showStatus('An unexpected error occurred. Please check the console for details.', 'error');
});

// Handle model loading errors gracefully
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    if (event.reason.message && event.reason.message.includes('model')) {
        showStatus('Model loading failed. Please check if model files exist in "my_model" folder.', 'error');
    }
});