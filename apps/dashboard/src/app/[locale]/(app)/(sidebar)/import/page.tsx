"use client";

import React, { useState } from 'react';
import { UploadCloud, FileType, CheckCircle, AlertCircle } from 'lucide-react';
import { submitVendingData } from './actions';

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
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Import Spreadsheet Data</h1>
      <p className="text-gray-600 mb-8">Upload your CSV exports to sync sales, commissions, and expenses.</p>

      <div className="bg-white p-8 rounded-xl shadow border border-gray-100 mb-6">
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition relative">
          <input 
            type="file" 
            accept=".csv" 
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <UploadCloud size={48} className="text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {file ? file.name : 'Drag and drop your CSV file here'}
          </h3>
          <p className="text-sm text-gray-500">
            {file ? `${(file.size / 1024).toFixed(1)} KB` : 'or click to browse from your computer'}
          </p>
        </div>

        {file && (
          <div className="mt-6 flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <FileType className="text-blue-500 mr-3" size={24} />
              <div>
                <p className="font-medium text-sm text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">Ready to upload</p>
              </div>
            </div>
            <button 
              onClick={handleUpload}
              disabled={status === 'uploading'}
              className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition"
            >
              {status === 'uploading' ? 'Processing...' : 'Import Data'}
            </button>
          </div>
        )}
      </div>

      {status === 'success' && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg flex items-start">
          <CheckCircle className="mr-3 mt-0.5 flex-shrink-0" size={20} />
          <div>
            <h4 className="font-medium">Upload Successful</h4>
            <p className="text-sm mt-1">{message}</p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg flex items-start">
          <AlertCircle className="mr-3 mt-0.5 flex-shrink-0" size={20} />
          <div>
            <h4 className="font-medium">Upload Failed</h4>
            <p className="text-sm mt-1">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
