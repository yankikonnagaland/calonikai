/**
 * Image Optimization Service for Cost-Effective AI Analysis
 * Reduces Gemini API costs through intelligent image preprocessing
 */

import sharp from 'sharp';
import crypto from 'crypto';

interface OptimizationResult {
  optimizedImage: Buffer;
  compressionRatio: number;
  originalSize: number;
  optimizedSize: number;
  savings: string;
}

export class ImageOptimizer {
  private static readonly MAX_DIMENSION = 512; // Gemini works well with 512x512
  private static readonly QUALITY = 70; // Balance between quality and size
  private static readonly MAX_FILE_SIZE = 150 * 1024; // 150KB max

  /**
   * Optimizes image for Gemini API analysis
   * Reduces costs by minimizing token usage while maintaining recognition quality
   */
  static async optimizeForAnalysis(imageBuffer: Buffer): Promise<OptimizationResult> {
    const originalSize = imageBuffer.length;
    
    try {
      let optimized = sharp(imageBuffer)
        .resize(this.MAX_DIMENSION, this.MAX_DIMENSION, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({
          quality: this.QUALITY,
          progressive: true,
          mozjpeg: true, // Better compression
        });

      let result = await optimized.toBuffer();

      // If still too large, reduce quality further
      if (result.length > this.MAX_FILE_SIZE) {
        result = await sharp(imageBuffer)
          .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 50, progressive: true, mozjpeg: true })
          .toBuffer();
      }

      const compressionRatio = originalSize / result.length;
      const savings = ((originalSize - result.length) / originalSize * 100).toFixed(1);

      return {
        optimizedImage: result,
        compressionRatio,
        originalSize,
        optimizedSize: result.length,
        savings: `${savings}%`
      };
    } catch (error) {
      console.error('Image optimization failed:', error);
      // Return original if optimization fails
      return {
        optimizedImage: imageBuffer,
        compressionRatio: 1,
        originalSize,
        optimizedSize: originalSize,
        savings: '0%'
      };
    }
  }

  /**
   * Creates a hash for image caching to avoid re-analyzing identical images
   */
  static createImageHash(imageBuffer: Buffer): string {
    return crypto
      .createHash('sha256')
      .update(imageBuffer)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Pre-processes image to enhance food recognition accuracy
   * This helps Gemini provide better results with smaller images
   */
  static async enhanceForFoodRecognition(imageBuffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(imageBuffer)
        .resize(512, 512, { fit: 'inside' })
        .modulate({
          brightness: 1.1, // Slightly brighter
          saturation: 1.2, // More vibrant colors
        })
        .sharpen(1, 1, 0.5) // Enhance edges for better food detection
        .jpeg({ quality: 75 })
        .toBuffer();
    } catch (error) {
      console.error('Image enhancement failed:', error);
      return imageBuffer;
    }
  }
}