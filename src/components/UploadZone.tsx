import { useCallback } from 'react';
import { Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
}

export function UploadZone({ onFilesSelected, isProcessing }: UploadZoneProps) {
  const { toast } = useToast();

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith('image/')
      );

      if (files.length === 0) {
        toast({
          title: 'No images found',
          description: 'Please upload image files only.',
          variant: 'destructive',
        });
        return;
      }

      onFilesSelected(files);
    },
    [onFilesSelected, toast]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []).filter((file) =>
        file.type.startsWith('image/')
      );

      if (files.length === 0) {
        toast({
          title: 'No images found',
          description: 'Please upload image files only.',
          variant: 'destructive',
        });
        return;
      }

      onFilesSelected(files);
      e.target.value = '';
    },
    [onFilesSelected, toast]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="glass-effect rounded-2xl p-12 border-2 border-dashed border-primary/30 hover:border-primary/60 transition-all duration-300 cursor-pointer group"
    >
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
        id="file-upload"
        disabled={isProcessing}
      />
      <label htmlFor="file-upload" className="cursor-pointer">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="p-6 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <Upload className="w-12 h-12 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-foreground">
              Drop images here or click to upload
            </h3>
            <p className="text-muted-foreground">
              Supports bulk upload • Faces will be automatically detected and blurred
            </p>
            <p className="text-sm text-muted-foreground">
              Images will be downscaled to 150 PPI
            </p>
          </div>
          {isProcessing && (
            <div className="flex items-center gap-2 text-accent">
              <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium">Processing images...</span>
            </div>
          )}
        </div>
      </label>
    </div>
  );
}
