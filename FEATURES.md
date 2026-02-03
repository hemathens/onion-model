# Onion Shelf Life Prediction - Feature Extraction System

## Overview
This system uses real computer vision techniques to extract features from onion images and predict shelf life, based on the methodology defined in `online-shelf-life.ipynb`.

## Extracted Features

### 1. Physical Dimensions
- **Length (mm)**: Vertical dimension
- **Width (mm)**: Horizontal diameter  
- **Height (mm)**: Depth dimension
- **Diameter (mm)**: Maximum diameter
- **Size Class**: Small/Medium/Large/Extra Large

**Extraction Method**: Detects onion pixels, finds bounding box, estimates real dimensions using scale factor.

### 2. Black Spots Count
- **Description**: Number of visible black/dark spots on surface
- **Range**: 0-20+ spots
- **Impact**: Each spot reduces shelf life by ~0.8 days

**Extraction Method**: Flood-fill algorithm to detect connected dark regions (brightness < 60).

### 3. Surface Texture Score
- **Scale**: 1-4
  - 1 = Smooth (fresh)
  - 2 = Slightly wrinkled
  - 3 = Wrinkled
  - 4 = Very soft/deteriorated
- **Impact**: Each point above 1 reduces shelf life by 3 days

**Extraction Method**: Sobel edge detection to measure surface roughness.

### 4. Skin Condition Score
- **Scale**: 1-5
  - 1 = Excellent (dry, papery skin)
  - 2 = Good
  - 3 = Fair
  - 4 = Poor
  - 5 = Very poor (cracks, open necks, rot)
- **Impact**: Each point above 1 reduces shelf life by 4 days

**Extraction Method**: Analyzes brightness, saturation, and dry skin ratio.

### 5. Damage Indicators (Binary Flags)

#### Has Bruises
- **Detection**: Dark discolored brownish areas
- **Threshold**: > 5% of onion pixels
- **Impact**: Part of visible damage penalty

#### Has Cuts
- **Detection**: Sharp edges and irregular boundaries
- **Method**: Detects sharp brightness changes (> 80 units)
- **Threshold**: > 2% of pixels show sharp edges
- **Impact**: Part of visible damage penalty

#### Has Lesions
- **Detection**: Very dark, low saturation patches (soft spots)
- **Threshold**: > 8% of onion pixels
- **Impact**: Part of visible damage penalty

#### Visible Damage Flag
- **Value**: 1 if any damage detected, 0 otherwise
- **Impact**: Reduces shelf life by 8 days

### 6. Sprouting Detection
- **Description**: Green shoots emerging from onion
- **Detection**: Green pixels (G > R+35 and G > B+35)
- **Impact**: 
  - > 5% sprouting: -10 days
  - > 2% sprouting: -5 days

### 7. Color Analysis
- **Average Brightness**: Overall image brightness
- **Average Saturation**: Color vibrancy
- **Usage**: Determines onion detection and quality assessment

## Shelf Life Calculation Formula

```javascript
baseShelfLife = 30 days (perfect onion)

shelfLife = baseShelfLife
          - (black_spots_count × 0.8)
          - ((surface_texture_score - 1) × 3)
          - ((skin_condition_score - 1) × 4)
          - (visible_damage_flag × 8)
          - sprouting_penalty

// Constrain to 0-37 days range
shelfLife = max(0, min(37, shelfLife))
```

## 4-Class Mapping

After calculating shelf life, the system maps to one of 4 classes:

1. **Class 0**: 0 days (severe spoilage)
2. **Class 5-10**: 5-10 days (bad condition)
3. **Class 15-19**: 15-19 days (fair condition)
4. **Class 29-37**: 29-37 days (excellent condition)

## Real-Time Webcam Processing

The system extracts all these features in real-time from webcam feed:

1. Captures frame from webcam
2. Extracts all visual features
3. Calculates shelf life
4. Maps to class range
5. Displays prediction + extracted features

## Technical Implementation

### Files:
- `feature_extraction.js`: Computer vision feature extraction module
- `app.js`: Main application logic
- `index.html`: User interface
- `online-shelf-life.ipynb`: Original Python notebook with feature definitions

### Key Algorithms:
- **Flood Fill**: For black spot detection
- **Sobel Edge Detection**: For texture analysis
- **Color Space Analysis**: For skin condition and damage detection
- **Bounding Box**: For dimension estimation

## Usage

1. Upload onion image or start webcam
2. System automatically extracts all features
3. Displays shelf life prediction
4. Shows detailed feature breakdown

## Accuracy Factors

Features that most impact prediction:
1. **Visible damage** (-8 days)
2. **Skin condition** (up to -20 days)
3. **Sprouting** (up to -10 days)
4. **Black spots** (variable impact)
5. **Surface texture** (up to -12 days)

## Future Enhancements

- Machine learning model training on extracted features
- Multi-angle analysis for better dimension estimation
- Temporal tracking for shelf life monitoring
- Integration with AR projection system
