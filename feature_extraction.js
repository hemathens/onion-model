/**
 * Onion Feature Extraction Module
 * Extracts visual features from onion images for shelf life prediction
 * Based on the features defined in online-shelf-life.ipynb
 */

console.log('=== FEATURE_EXTRACTION.JS LOADED - VERSION 2.0 ===');

class OnionFeatureExtractor {
    constructor() {
        this.features = {};
    }

    /**
     * Extract all features from an image element (canvas/img)
     * @param {HTMLCanvasElement|HTMLImageElement} imageElement 
     * @returns {Object} Extracted features
     */
    async extractFeatures(imageElement) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 224;
        canvas.height = 224;
        ctx.drawImage(imageElement, 0, 0, 224, 224);
        
        const imageData = ctx.getImageData(0, 0, 224, 224);
        const data = imageData.data;
        
        console.log('=== FEATURE EXTRACTION START ===');
        
        // Extract all features
        const dimensions = this.estimateDimensions(data, 224, 224);
        console.log('✓ Dimensions:', dimensions);
        
        const black_spots_count = this.countBlackSpots(data);
        console.log('✓ Black spots count:', black_spots_count);
        
        const surface_texture_score = this.analyzeSurfaceTexture(data);
        console.log('✓ Surface texture score:', surface_texture_score);
        
        const skin_condition_score = this.analyzeSkinCondition(data);
        console.log('✓ Skin condition score:', skin_condition_score);
        
        const has_bruises = this.detectBruises(data);
        console.log('✓ Has bruises:', has_bruises);
        
        const has_cuts = this.detectCuts(data);
        console.log('✓ Has cuts:', has_cuts);
        
        const has_lesions = this.detectLesions(data);
        console.log('✓ Has lesions:', has_lesions);
        
        const color_analysis = this.analyzeColor(data);
        console.log('✓ Color analysis:', color_analysis);
        
        const sprouting_detected = this.detectSprouting(data);
        console.log('✓ Sprouting detected:', (sprouting_detected * 100).toFixed(2) + '%');
        
        const features = {
            dimensions: dimensions,
            black_spots_count: black_spots_count,
            surface_texture_score: surface_texture_score,
            skin_condition_score: skin_condition_score,
            has_bruises: has_bruises,
            has_cuts: has_cuts,
            has_lesions: has_lesions,
            color_analysis: color_analysis,
            sprouting_detected: sprouting_detected
        };
        
        // Calculate visible damage flag
        features.visible_damage_flag = (features.has_bruises || features.has_cuts || features.has_lesions) ? 1 : 0;
        console.log('✓ Visible damage flag:', features.visible_damage_flag);
        
        console.log('=== ALL FEATURES EXTRACTED ===');
        console.log(features);
        
        this.features = features;
        return features;
    }

    /**
     * Estimate onion dimensions from image
     */
    estimateDimensions(data, width, height) {
        let minX = width, maxX = 0, minY = height, maxY = 0;
        let onionPixels = 0;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                
                // Check if pixel is onion-colored
                if (this.isOnionPixel(r, g, b)) {
                    onionPixels++;
                    minX = Math.min(minX, x);
                    maxX = Math.max(maxX, x);
                    minY = Math.min(minY, y);
                    maxY = Math.max(maxY, y);
                }
            }
        }
        
        const pixelWidth = maxX - minX;
        const pixelHeight = maxY - minY;
        
        // Estimate real dimensions (assuming average onion is ~75mm)
        const scaleFactor = 75 / Math.max(pixelWidth, pixelHeight);
        
        return {
            length_mm: Math.round(pixelHeight * scaleFactor * 10) / 10,
            width_mm: Math.round(pixelWidth * scaleFactor * 10) / 10,
            height_mm: Math.round(pixelWidth * scaleFactor * 10) / 10,
            diameter_mm: Math.round(Math.max(pixelWidth, pixelHeight) * scaleFactor * 10) / 10,
            size_class: this.classifySize(Math.max(pixelWidth, pixelHeight) * scaleFactor)
        };
    }

    /**
     * Classify onion size based on diameter
     */
    classifySize(diameter) {
        if (diameter < 50) return 'Small';
        if (diameter < 75) return 'Medium';
        if (diameter < 100) return 'Large';
        return 'Extra Large';
    }

    /**
     * Count black spots on onion surface
     */
    countBlackSpots(data) {
        const width = 224;
        const height = 224;
        let darkSpotPixels = 0;
        let onionPixels = 0;
        
        // Count dark pixels on onion surface
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            if (this.isOnionPixel(r, g, b)) {
                onionPixels++;
                
                const brightness = (r + g + b) / 3;
                
                // Dark spots: significantly darker than normal onion
                // Normal onion brightness: 100-180
                // Dark spots: < 80
                if (brightness < 80 && brightness > 20) {
                    darkSpotPixels++;
                }
            }
        }
        
        if (onionPixels === 0) return 0;
        
        // Calculate dark spot ratio
        const darkRatio = darkSpotPixels / onionPixels;
        
        // Map ratio to spot count (0-21 range as per notebook)
        // Fresh onion: 0-2 spots (< 2% dark pixels)
        // Moderate: 3-8 spots (2-8% dark pixels)
        // Poor: 9-21 spots (> 8% dark pixels)
        let spotCount;
        if (darkRatio < 0.02) {
            spotCount = Math.floor(darkRatio * 100); // 0-2 spots
        } else if (darkRatio < 0.08) {
            spotCount = 2 + Math.floor((darkRatio - 0.02) * 100); // 2-8 spots
        } else {
            spotCount = 8 + Math.floor((darkRatio - 0.08) * 150); // 8-21 spots
        }
        
        return Math.min(21, Math.max(0, spotCount));
    }

    /**
     * Flood fill algorithm to detect connected dark regions
     */
    floodFill(data, startX, startY, width, height, visited) {
        const stack = [[startX, startY]];
        let count = 0;
        
        while (stack.length > 0) {
            const [x, y] = stack.pop();
            const key = `${x},${y}`;
            
            if (visited.has(key) || x < 0 || x >= width || y < 0 || y >= height) {
                continue;
            }
            
            const idx = (y * width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const brightness = (r + g + b) / 3;
            
            if (brightness >= 60) continue;
            
            visited.add(key);
            count++;
            
            // Add neighbors (4-connectivity)
            if (count < 100) { // Limit cluster size check
                stack.push([x + 1, y]);
                stack.push([x - 1, y]);
                stack.push([x, y + 1]);
                stack.push([x, y - 1]);
            }
        }
        
        return count;
    }

    /**
     * Analyze surface texture (1=smooth to 4=very soft)
     */
    analyzeSurfaceTexture(data) {
        const width = 224;
        const height = 224;
        let totalVariance = 0;
        let samples = 0;
        
        // Calculate local variance as texture indicator
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                
                if (!this.isOnionPixel(r, g, b)) continue;
                
                const centerBrightness = (r + g + b) / 3;
                
                // Check 4 neighbors
                let neighborSum = 0;
                let neighborCount = 0;
                
                const neighbors = [
                    [x-1, y], [x+1, y], [x, y-1], [x, y+1]
                ];
                
                for (const [nx, ny] of neighbors) {
                    const nidx = (ny * width + nx) * 4;
                    const nr = data[nidx];
                    const ng = data[nidx + 1];
                    const nb = data[nidx + 2];
                    const nBrightness = (nr + ng + nb) / 3;
                    
                    neighborSum += Math.abs(centerBrightness - nBrightness);
                    neighborCount++;
                }
                
                if (neighborCount > 0) {
                    totalVariance += neighborSum / neighborCount;
                    samples++;
                }
            }
        }
        
        const avgVariance = samples > 0 ? totalVariance / samples : 0;
        
        // Map variance to texture score (1-4)
        // Low variance = smooth, high variance = rough/wrinkled
        if (avgVariance < 10) return 1; // Smooth
        if (avgVariance < 20) return 2; // Slightly wrinkled
        if (avgVariance < 35) return 3; // Wrinkled
        return 4; // Very soft/deteriorated
    }

    /**
     * Sobel operator for edge detection (X direction)
     */
    getSobelX(data, x, y, width) {
        const kernel = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
        let sum = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
                const idx = ((y + ky) * width + (x + kx)) * 4;
                const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                sum += brightness * kernel[ky + 1][kx + 1];
            }
        }
        
        return sum;
    }

    /**
     * Sobel operator for edge detection (Y direction)
     */
    getSobelY(data, x, y, width) {
        const kernel = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
        let sum = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
                const idx = ((y + ky) * width + (x + kx)) * 4;
                const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                sum += brightness * kernel[ky + 1][kx + 1];
            }
        }
        
        return sum;
    }

    /**
     * Analyze skin condition (1=excellent to 5=poor)
     */
    analyzeSkinCondition(data) {
        let totalBrightness = 0;
        let totalSaturation = 0;
        let goodSkinPixels = 0;
        let poorSkinPixels = 0;
        let samples = 0;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            if (!this.isOnionPixel(r, g, b)) continue;
            
            const brightness = (r + g + b) / 3;
            const maxColor = Math.max(r, g, b);
            const minColor = Math.min(r, g, b);
            const saturation = maxColor === 0 ? 0 : (maxColor - minColor) / maxColor;
            
            totalBrightness += brightness;
            totalSaturation += saturation;
            samples++;
            
            // Good skin: bright, saturated, golden color
            if (brightness > 120 && saturation > 0.25 && r > g && g > b) {
                goodSkinPixels++;
            }
            
            // Poor skin: dark, low saturation
            if (brightness < 80 || saturation < 0.15) {
                poorSkinPixels++;
            }
        }
        
        if (samples === 0) return 3; // Default middle score
        
        const avgBrightness = totalBrightness / samples;
        const avgSaturation = totalSaturation / samples;
        const goodRatio = goodSkinPixels / samples;
        const poorRatio = poorSkinPixels / samples;
        
        // Score based on multiple factors
        if (goodRatio > 0.4 && avgBrightness > 130 && avgSaturation > 0.30) {
            return 1; // Excellent
        } else if (goodRatio > 0.25 && avgBrightness > 110 && avgSaturation > 0.25) {
            return 2; // Good
        } else if (poorRatio < 0.3 && avgBrightness > 90) {
            return 3; // Fair
        } else if (poorRatio < 0.5 || avgBrightness > 70) {
            return 4; // Poor
        } else {
            return 5; // Very poor
        }
    }

    /**
     * Detect bruises (dark discolored areas)
     */
    detectBruises(data) {
        let bruisedPixels = 0;
        let onionPixels = 0;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            if (!this.isOnionPixel(r, g, b)) continue;
            
            onionPixels++;
            
            // Bruises: dark brownish/reddish areas
            // Characteristics: low brightness, brownish tone
            const brightness = (r + g + b) / 3;
            const maxColor = Math.max(r, g, b);
            const minColor = Math.min(r, g, b);
            
            // Bruised area: darker than normal, brownish
            if (brightness >= 40 && brightness < 100 && r >= g && r >= b) {
                bruisedPixels++;
            }
        }
        
        if (onionPixels === 0) return 0;
        
        const bruiseRatio = bruisedPixels / onionPixels;
        
        // Dynamic: return 1 if > 5% of onion shows bruising
        return bruiseRatio > 0.05 ? 1 : 0;
    }

    /**
     * Detect cuts or wounds (sharp edges, irregular boundaries)
     */
    detectCuts(data) {
        const width = 224;
        const height = 224;
        let sharpEdgeCount = 0;
        let totalEdgeChecks = 0;
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                
                if (!this.isOnionPixel(r, g, b)) continue;
                
                const brightness = (r + g + b) / 3;
                
                // Check right neighbor
                const rightIdx = (y * width + (x + 1)) * 4;
                const rr = data[rightIdx];
                const rg = data[rightIdx + 1];
                const rb = data[rightIdx + 2];
                
                if (!this.isOnionPixel(rr, rg, rb)) continue;
                
                totalEdgeChecks++;
                
                const rightBrightness = (rr + rg + rb) / 3;
                
                // Sharp brightness change indicates cut/wound
                if (Math.abs(brightness - rightBrightness) > 60) {
                    sharpEdgeCount++;
                }
            }
        }
        
        if (totalEdgeChecks === 0) return 0;
        
        const sharpEdgeRatio = sharpEdgeCount / totalEdgeChecks;
        
        // Dynamic: return 1 if > 3% of pixel pairs show sharp transitions
        return sharpEdgeRatio > 0.03 ? 1 : 0;
    }

    /**
     * Detect lesions or soft spots (irregular dark patches)
     */
    detectLesions(data) {
        let lesionPixels = 0;
        let onionPixels = 0;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            if (!this.isOnionPixel(r, g, b)) continue;
            
            onionPixels++;
            
            // Lesions: very dark, grayish, low saturation areas (soft rot)
            const brightness = (r + g + b) / 3;
            const maxColor = Math.max(r, g, b);
            const minColor = Math.min(r, g, b);
            const saturation = maxColor === 0 ? 0 : (maxColor - minColor) / maxColor;
            
            // Lesion characteristics: very dark + low saturation (grayish)
            if (brightness < 70 && saturation < 0.25) {
                lesionPixels++;
            }
        }
        
        if (onionPixels === 0) return 0;
        
        const lesionRatio = lesionPixels / onionPixels;
        
        // Dynamic: return 1 if > 6% of onion shows lesions
        return lesionRatio > 0.06 ? 1 : 0;
    }

    /**
     * Detect sprouting (green shoots)
     */
    detectSprouting(data) {
        let greenPixels = 0;
        let totalPixels = 0;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            totalPixels++;
            
            // Detect green sprouting
            if (g > r + 35 && g > b + 35 && g >= 100) {
                greenPixels++;
            }
        }
        
        return totalPixels > 0 ? greenPixels / totalPixels : 0;
    }

    /**
     * Analyze color distribution
     */
    analyzeColor(data) {
        let totalBrightness = 0;
        let totalSaturation = 0;
        let samples = 0;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            if (!this.isOnionPixel(r, g, b)) continue;
            
            const brightness = (r + g + b) / 3;
            const maxColor = Math.max(r, g, b);
            const minColor = Math.min(r, g, b);
            const saturation = maxColor === 0 ? 0 : (maxColor - minColor) / maxColor;
            
            totalBrightness += brightness;
            totalSaturation += saturation;
            samples++;
        }
        
        return {
            avg_brightness: samples > 0 ? totalBrightness / samples : 0,
            avg_saturation: samples > 0 ? totalSaturation / samples : 0
        };
    }

    /**
     * Check if pixel is onion-colored
     */
    isOnionPixel(r, g, b, allowDark = false) {
        const brightness = (r + g + b) / 3;
        
        // Allow dark spots on onion
        if (allowDark && brightness < 80 && brightness > 10) {
            // Dark brownish tones (spots on onion)
            if (r >= g && r >= b && r < 120) {
                return true;
            }
        }
        
        // Brown/Golden/Yellow onion - RELAXED for better detection
        if (r >= 80 && r <= 230 && g >= 50 && g <= 200 && b >= 20 && b <= 130 && r > b + 20) {
            return true;
        }
        // White onion
        if (r >= 170 && g >= 170 && b >= 170 && r <= 255 && g <= 255 && b <= 255) {
            return true;
        }
        // Purple/Red onion
        if (r >= 80 && r <= 180 && b >= 70 && b <= 170 && r > g - 10 && b > g - 30) {
            return true;
        }
        
        return false;
    }

    /**
     * Calculate shelf life based on extracted features
     * Uses the same logic as the Python notebook
     */
    calculateShelfLife(features) {
        let baseShelfLife = 30; // Baseline for perfect onion
        
        // Reduce shelf life based on various factors
        let shelfLife = baseShelfLife;
        shelfLife -= features.black_spots_count * 0.8;
        shelfLife -= (features.surface_texture_score - 1) * 3;
        shelfLife -= (features.skin_condition_score - 1) * 4;
        shelfLife -= features.visible_damage_flag * 8;
        
        // Sprouting penalty
        if (features.sprouting_detected > 0.05) {
            shelfLife -= 10;
        } else if (features.sprouting_detected > 0.02) {
            shelfLife -= 5;
        }
        
        // Constrain between 0-37 days
        shelfLife = Math.max(0, Math.min(37, Math.round(shelfLife)));
        
        return shelfLife;
    }

    /**
     * Get quality grade based on shelf life
     */
    getQualityGrade(shelfLife) {
        if (shelfLife > 25) return 'A';
        if (shelfLife > 18) return 'B';
        if (shelfLife > 10) return 'C';
        return 'D';
    }
}

// Export for use in main app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OnionFeatureExtractor;
}
