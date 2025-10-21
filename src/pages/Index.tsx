import { useState } from 'react';
import { Shield, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UploadZone } from '@/components/UploadZone';
import { ImageGrid } from '@/components/ImageGrid';
import { processImage, dataURLtoBlob, ProcessedImage } from '@/lib/imageProcessor';
import { useToast } from '@/hooks/use-toast';
import JSZip from 'jszip';

const Index = () => {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFilesSelected = async (files: File[]) => {
    setIsProcessing(true);
    const newImages: ProcessedImage[] = [];

    for (const file of files) {
      try {
        toast({
          title: 'Processing...',
          description: `Processing ${file.name}`,
        });
        
        const processed = await processImage(file);
        newImages.push(processed);
        
        toast({
          title: 'Success',
          description: `${file.name} processed with ${processed.facesDetected} face(s) blurred`,
        });
      } catch (error) {
        console.error('Error processing image:', error);
        toast({
          title: 'Error',
          description: `Failed to process ${file.name}`,
          variant: 'destructive',
        });
      }
    }

    setImages((prev) => [...prev, ...newImages]);
    setIsProcessing(false);
  };

  const handleDownload = (image: ProcessedImage) => {
    const blob = dataURLtoBlob(image.processedDataUrl);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `processed_${image.originalFile.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = async () => {
    if (images.length === 0) return;

    const zip = new JSZip();
    
    images.forEach((image) => {
      const blob = dataURLtoBlob(image.processedDataUrl);
      zip.file(`processed_${image.originalFile.name}`, blob);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `processed_images_${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Downloaded',
      description: `${images.length} images downloaded as ZIP`,
    });
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-2xl bg-primary/10 backdrop-blur-sm">
              <Shield className="w-16 h-16 text-primary" />
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
            Face Blur & Downscale
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            This site will automatically detect and blur faces, remove your photo's metadata, and downscale to 150ppi for the GSAPP Urbanist dataset project. Please double-check the outputs for accuracy as it may not work in 100% of occasions.
          </p>
        </div>

        {/* Upload Zone */}
        <UploadZone onFilesSelected={handleFilesSelected} isProcessing={isProcessing} />

        {/* Download All Button */}
        {images.length > 0 && (
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={handleDownloadAll}
              className="gradient-primary text-lg px-8 py-6 gap-3"
            >
              <Download className="w-5 h-5" />
              Download All ({images.length})
            </Button>
          </div>
        )}

        {/* Image Grid */}
        <ImageGrid images={images} onDownload={handleDownload} />
      </div>
    </div>
  );
};

export default Index;
