"use client";

import React, { useState } from 'react';
import { UploadCloud, FileType, CheckCircle, AlertCircle } from 'lucide-react';
import { submitVendingData } from './actions';
import { Card, CardContent } from "@vendcfo/ui/card";
import { Button } from "@vendcfo/ui/button";

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0] || null);
      setStatus('idle');
      setMessage('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus('uploading');
    
    const formData = new FormData();
    formData.append('csvFile', file);

    try {
      const result = await submitVendingData(formData);
      if (result.success) {
        setStatus('success');
        setMessage(result.message);
      } else {
        setStatus('error');
        setMessage(result.error || 'Failed to import');
      }
    } catch (e: any) {
      setStatus('error');
      setMessage(e.message || 'Unknown error occurred');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <h1 className="text-2xl font-bold text-foreground mb-2">Import Spreadsheet Data</h1>
      <p className="text-muted-foreground mb-8">Upload your CSV exports to sync sales, commissions, and expenses.</p>

      <Card className="mb-6">
        <CardContent className="p-8">
          <div className="border-2 border-dashed border-border rounded-xl p-12 flex flex-col items-center justify-center text-center hover:bg-secondary/50 transition relative">
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <UploadCloud size={48} className="text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">
              {file ? file.name : 'Drag and drop your CSV file here'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {file ? `${(file.size / 1024).toFixed(1)} KB` : 'or click to browse from your computer'}
            </p>
          </div>

          {file && (
            <div className="mt-6 flex items-center justify-between bg-secondary p-4 rounded-lg border border-border">
              <div className="flex items-center">
                <FileType className="text-blue-500 mr-3" size={24} />
                <div>
                  <p className="font-medium text-sm text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">Ready to upload</p>
                </div>
              </div>
              <Button
                onClick={handleUpload}
                disabled={status === 'uploading'}
              >
                {status === 'uploading' ? 'Processing...' : 'Import Data'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {status === 'success' && (
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4 flex items-start">
            <CheckCircle className="text-green-500 mr-3 mt-0.5 flex-shrink-0" size={20} />
            <div>
              <h4 className="font-medium text-foreground">Upload Successful</h4>
              <p className="text-sm text-muted-foreground mt-1">{message}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {status === 'error' && (
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4 flex items-start">
            <AlertCircle className="text-red-500 mr-3 mt-0.5 flex-shrink-0" size={20} />
            <div>
              <h4 className="font-medium text-foreground">Upload Failed</h4>
              <p className="text-sm text-muted-foreground mt-1">{message}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
