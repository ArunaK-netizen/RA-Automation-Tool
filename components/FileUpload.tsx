import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Allocation, SlotMap } from '@/lib/types';
import { BookOpen, Users, Loader } from 'lucide-react';

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
    }
  };

  const handleClearFiles = () => {
    if (coursesFileRef.current) coursesFileRef.current.value = '';
    if (rasFileRef.current) rasFileRef.current.value = '';
    setFiles({});
  };

  const FileInput = ({ id, file, type, icon }: { id: string, file?: File, type: 'courses' | 'ras', icon: React.ReactNode }) => (
    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center bg-background/50 hover:border-primary transition-colors">
      <input
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        ref={type === 'courses' ? coursesFileRef : rasFileRef}
        id={id}
        onChange={handleFileChange(type)}
      />
      <label htmlFor={id} className="cursor-pointer flex flex-col items-center justify-center">
        {icon}
        <span className="text-foreground font-medium mt-4">Upload {type === 'courses' ? 'Courses' : 'RAs'} File</span>
        <span className="text-sm text-muted mt-1">
          {file ? file.name : 'Click or drag and drop'}
        </span>
      </label>
    </div>
  );

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border p-4 space-y-4">
      <h3 className="font-semibold text-foreground">Upload Files</h3>
      <FileInput id="courses-upload" file={files.courses} type="courses" icon={<BookOpen className="w-10 h-10 text-muted" />} />
      <FileInput id="ras-upload" file={files.ras} type="ras" icon={<Users className="w-10 h-10 text-muted" />} />

      <div className="flex justify-end space-x-3 pt-2">
        <button
          onClick={handleClearFiles}
          className="px-4 py-2 text-sm font-medium text-muted bg-background rounded-md hover:bg-border transition-colors disabled:opacity-50"
          disabled={!files.courses && !files.ras}
        >
          Clear
        </button>
        <button
          onClick={handleSubmit}
          disabled={!files.courses || !files.ras}
          className="px-6 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {false ? (
            <><Loader className="animate-spin w-4 h-4 mr-2" /> Processing...</>
          ) : 'Start Allocation'}
        </button>
      </div>
    </div>
  );
}
