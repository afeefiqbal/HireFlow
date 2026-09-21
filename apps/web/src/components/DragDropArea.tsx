'use client';

import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';

interface DragDropAreaProps {
  /** Callback invoked with the array of Files dropped or selected */
  onFiles: (files: File[]) => void;
}

export const DragDropArea: React.FC<DragDropAreaProps> = ({ onFiles }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files);
    onFiles(fileArray);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // Reset the input so the same file can be selected again if needed
    e.target.value = '';
  };

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
        isDragging ? 'border-[#00b074] bg-[#f0fdf4]' : 'border-slate-300 bg-white'
      }`}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={openFileDialog}
    >
      <Upload className="h-8 w-8 text-[#00b074] mb-2" />
      <p className="text-sm text-slate-600 mb-1">Drag & drop files here, or click to select</p>
      <p className="text-xs text-slate-500">Supports multiple files</p>
      <input
        type="file"
        multiple
        ref={fileInputRef}
        className="hidden"
        onChange={onFileChange}
      />
    </div>
  );
};
