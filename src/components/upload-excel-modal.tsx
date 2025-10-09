"use client"
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, File, CheckCircle, XCircle, Loader } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

interface UploadExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (dataSourceId: string) => void;
}

export function UploadExcelModal({ isOpen, onClose, onSuccess }: UploadExcelModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [dataSourceId, setDataSourceId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    setFile(uploadedFile);
    setUploadStatus('uploading');

    const formData = new FormData();
    formData.append('file', uploadedFile);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload', true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        setUploadProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        if (response.success) {
          setUploadStatus('success');
          setDataSourceId(response.data.id);
          setSuccessMessage(response.data.message || 'File uploaded successfully!');
          
          // Auto-close and trigger success callback after a short delay
          setTimeout(() => {
            onSuccess(response.data.id);
            onClose();
          }, 2000);
        } else {
          setUploadStatus('error');
          setErrorMessage(response.error || 'Upload failed');
        }
      } else {
        setUploadStatus('error');
        setErrorMessage('Server error');
      }
    };

    xhr.onerror = () => {
      setUploadStatus('error');
      setErrorMessage('Network error');
    };

    xhr.send(formData);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
        'application/vnd.ms-excel': ['.xls'],
        'text/csv': ['.csv'],
    },
    multiple: false
  });


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Data Source</DialogTitle>
          <DialogDescription>Upload an Excel or CSV file to create a new data source.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {!file ? (
            <div
              {...getRootProps()}
              className={`p-10 border-2 border-dashed rounded-md text-center cursor-pointer ${
                isDragActive ? 'border-primary' : 'border-muted'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Drag & drop a file here, or click to select a file
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center space-x-4">
                <File className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              {uploadStatus === 'uploading' && <Progress value={uploadProgress} className="mt-2" />}
              {uploadStatus === 'success' && (
                <div className="space-y-2 mt-4">
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="mr-2 h-4 w-4" /> 
                    {successMessage}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Closing automatically...
                  </p>
                </div>
              )}
              {uploadStatus === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
                  <div className="flex items-center text-red-600">
                    <XCircle className="mr-2 h-4 w-4" /> 
                    <span className="font-medium">Upload failed</span>
                  </div>
                  {errorMessage && (
                    <p className="text-sm text-red-600 mt-1 ml-6">{errorMessage}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}