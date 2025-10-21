import { Download, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProcessedImage } from '@/lib/imageProcessor';

interface ImageGridProps {
  images: ProcessedImage[];
  onDownload: (image: ProcessedImage) => void;
}

export function ImageGrid({ images, onDownload }: ImageGridProps) {
  if (images.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">
          Processed Images ({images.length})
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((image) => (
          <div
            key={image.id}
            className="glass-effect rounded-xl overflow-hidden group hover:scale-[1.02] transition-all duration-300"
          >
            <div className="relative aspect-square">
              <img
                src={image.processedDataUrl}
                alt={image.originalFile.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button
                  size="sm"
                  onClick={() => onDownload(image)}
                  className="gradient-primary"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="p-4 space-y-2">
              <p className="text-sm font-medium text-foreground truncate">
                {image.originalFile.name}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{image.width} × {image.height}px</span>
                <div className="flex items-center gap-1 text-success">
                  <Check className="w-3 h-3" />
                  <span>{image.facesDetected} face(s) blurred</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
