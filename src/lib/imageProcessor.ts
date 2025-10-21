import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

export interface ProcessedImage {
  id: string;
  originalFile: File;
  processedDataUrl: string;
  width: number;
  height: number;
  facesDetected: number;
}

let detector: any = null;

async function getDetector() {
  if (!detector) {
    console.log('Loading face detection model...');
    detector = await pipeline(
      'object-detection',
      'Xenova/detr-resnet-50',
      { device: 'webgpu' }
    );
  }
  return detector;
}

function downscaleImage(canvas: HTMLCanvasElement, targetPPI: number = 150): HTMLCanvasElement {
  const originalPPI = 300; // Assume original is 300 PPI
  const scale = targetPPI / originalPPI;
  
  const newWidth = Math.round(canvas.width * scale);
  const newHeight = Math.round(canvas.height * scale);
  
  const scaledCanvas = document.createElement('canvas');
  scaledCanvas.width = newWidth;
  scaledCanvas.height = newHeight;
  
  const ctx = scaledCanvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  
  // Use smooth scaling for better quality
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(canvas, 0, 0, newWidth, newHeight);
  
  return scaledCanvas;
}

function blurFace(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  // Extract the face region
  const imageData = ctx.getImageData(x, y, width, height);
  
  // Apply a strong blur effect
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return;
  
  tempCtx.putImageData(imageData, 0, 0);
  
  // Apply blur using CSS filter
  ctx.save();
  ctx.filter = 'blur(50px)';
  ctx.drawImage(tempCanvas, x, y, width, height);
  ctx.restore();
}

export async function processImage(file: File): Promise<ProcessedImage> {
  return new Promise(async (resolve, reject) => {
    try {
      const img = new Image();
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        img.onload = async () => {
          try {
            // Create canvas for processing
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              reject(new Error('Could not get canvas context'));
              return;
            }
            
            ctx.drawImage(img, 0, 0);
            
            // Detect faces
            const detector = await getDetector();
            const detections = await detector(canvas.toDataURL(), {
              threshold: 0.5,
              percentage: true,
            });
            
            // Filter for person/face detections
            const faces = detections.filter((d: any) => 
              d.label === 'person' || d.label.includes('face')
            );
            
            console.log(`Detected ${faces.length} faces in image`);
            
            // Blur detected faces
            for (const face of faces) {
              const x = Math.floor(face.box.xmin * canvas.width);
              const y = Math.floor(face.box.ymin * canvas.height);
              const width = Math.floor((face.box.xmax - face.box.xmin) * canvas.width);
              const height = Math.floor((face.box.ymax - face.box.ymin) * canvas.height);
              
              // Focus on the head area for better blur
              const faceY = y;
              const faceHeight = Math.floor(height * 0.4); // Top 40% for face
              
              blurFace(ctx, x, faceY, width, faceHeight);
            }
            
            // Downscale to 150 PPI
            const scaledCanvas = downscaleImage(canvas, 150);
            
            resolve({
              id: Math.random().toString(36).substr(2, 9),
              originalFile: file,
              processedDataUrl: scaledCanvas.toDataURL('image/jpeg', 0.9),
              width: scaledCanvas.width,
              height: scaledCanvas.height,
              facesDetected: faces.length,
            });
          } catch (error) {
            reject(error);
          }
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    } catch (error) {
      reject(error);
    }
  });
}

export function dataURLtoBlob(dataURL: string): Blob {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new Blob([u8arr], { type: mime });
}
