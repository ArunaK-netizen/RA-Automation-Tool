'use client'

import { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { Allocation, SlotMap } from '@/lib/types';
import { BookOpen, Users, Loader2, UploadCloud, FileSpreadsheet, X } from 'lucide-react';

interface FileUploadProps {
  onDataUploaded: (data: { allocations: Allocation[], unallocatedLabs: Allocation[], slotMap: SlotMap }) => void;
  setIsLoading: (loading: boolean) => void;
}

// This function is needed on the client to pass the slotMap back to the parent
const generateSlotMap = (): SlotMap => {
  const slotMap: SlotMap = {};
  const theories = [
    'A1', 'F1', 'D1', 'TB1', 'TG1', 'B1', 'G1', 'E1', 'TC1', 'TAA1',
    'C1', 'V1', 'V2', 'D1', 'TE1', 'TCC1', 'E1', 'TA1', 'TF1', 'TD1',
    'A2', 'F2', 'D2', 'TB2', 'TG2', 'B2', 'G2', 'E2', 'TC2', 'TAA2',
    'C2', 'TD2', 'TBB2', 'D2', 'TE2', 'TCC2', 'E2', 'TA2', 'TF2', 'TDD2'
  ];
  for (let i = 1; i <= 160; i++) {
    slotMap[`L${i}`] = theories[i % theories.length];
  }
  return slotMap;
};

export default function FileUpload({ onDataUploaded, setIsLoading }: FileUploadProps) {
  const coursesFileRef = useRef<HTMLInputElement>(null);
  const rasFileRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<{
    courses?: File;
    ras?: File;
  }>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (type: 'courses' | 'ras') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFiles(prev => ({ ...prev, [type]: file }));
    }
  };

  const handleSubmit = async () => {
    if (!files.courses || !files.ras) {
      toast.error('Please upload both course and RA files');
      return;
    }

    setIsLoading(true);
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('courses', files.courses);
      formData.append('ras', files.ras);

      const response = await fetch('/api/allocate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Allocation failed');
      }

      const result = await response.json();
      const slotMap = generateSlotMap();
      onDataUploaded({
        allocations: result.allocations || [],
        unallocatedLabs: result.unallocatedLabs || [],
        slotMap
      });
      toast.success('Allocation completed successfully');

    } catch (error) {
      const err = error as Error;
      toast.error(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
      setIsProcessing(false);
    }
  };

  const handleClearFiles = () => {
    if (coursesFileRef.current) coursesFileRef.current.value = '';
    if (rasFileRef.current) rasFileRef.current.value = '';
    setFiles({});
  };

  const FileInput = ({ id, file, type, icon, title, description }: { id: string, file?: File, type: 'courses' | 'ras', icon: React.ReactNode, title: string, description: string }) => (
    <div className="relative group">
      <input
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        ref={type === 'courses' ? coursesFileRef : rasFileRef}
        id={id}
        onChange={handleFileChange(type)}
      />
      <label
        htmlFor={id}
        className={`
          flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer
          ${file
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-secondary/50'
          }
        `}
      >
        <div className={`
          p-4 rounded-full mb-4 transition-transform duration-300 group-hover:scale-110
          ${file ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}
        `}>
          {file ? <FileSpreadsheet className="w-8 h-8" /> : icon}
        </div>

        <div className="text-center space-y-1">
          <p className="font-semibold text-foreground">
            {file ? file.name : title}
          </p>
          <p className="text-xs text-muted-foreground max-w-[200px]">
            {file ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Ready for upload</span>
            ) : (
              description
            )}
          </p>
        </div>

        {file && (
          <button
            onClick={(e) => {
              e.preventDefault();
              setFiles(prev => {
                const newFiles = { ...prev };
                delete newFiles[type];
                return newFiles;
              });
              if (type === 'courses' && coursesFileRef.current) coursesFileRef.current.value = '';
              if (type === 'ras' && rasFileRef.current) rasFileRef.current.value = '';
            }}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </label>
    </div>
  );

  return (
    <div className="glass-card rounded-2xl p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold font-display tracking-tight">Upload Data Files</h2>
        <p className="text-muted-foreground">Upload your Course and RA Excel sheets to begin allocation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FileInput
          id="courses-upload"
          file={files.courses}
          type="courses"
          icon={<BookOpen className="w-8 h-8" />}
          title="Upload Courses File"
          description=""
        />
        <FileInput
          id="ras-upload"
          file={files.ras}
          type="ras"
          icon={<Users className="w-8 h-8" />}
          title="Upload RAs File"
          description=""
        />
      </div>

      <div className="flex justify-center pt-4">
        <button
          onClick={handleSubmit}
          disabled={!files.courses || !files.ras || isProcessing}
          className={`
            relative overflow-hidden group px-8 py-3 rounded-xl font-medium text-white transition-all duration-300
            ${!files.courses || !files.ras || isProcessing
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5'
            }
          `}
        >
          <div className="flex items-center gap-2 relative z-10">
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing Allocation...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-5 h-5" />
                <span>Start Allocation Process</span>
              </>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}
