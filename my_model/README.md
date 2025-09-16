# Model Files Directory

This directory should contain your Teachable Machine model files:

- `model.json` - The model architecture and configuration
- `metadata.json` - Model metadata including class labels
- `weights.bin` - Model weights (may be multiple files)

## How to Get Your Model Files

1. Go to [Teachable Machine](https://teachablemachine.withgoogle.com/)
2. Create and train an Image Project
3. Export your model as "TensorFlow.js"
4. Download and extract the files to this directory

## Example Structure

After adding your model files, this directory should look like:

```
my_model/
├── model.json
├── metadata.json
└── weights.bin
```

The application will automatically load these files when you start the webcam or upload an image.