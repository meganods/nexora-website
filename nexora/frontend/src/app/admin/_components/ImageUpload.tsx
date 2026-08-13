"use client";

import React, { useState } from 'react';
import { ImageIcon, X, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface ImageUploadProps {
  imageUrl: string;
  imagePublicId: string;
  onChange: (url: string, publicId: string) => void;
  label?: string;
  folder?: string;
}

export default function ImageUpload({
  imageUrl,
  imagePublicId,
  onChange,
  label = 'Image',
  folder = 'nexora/general',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const { data: signData } = await api.post('/upload/upload-signature');
      if (!signData.success) {
        setError('Failed to get secure upload credentials');
        return;
      }
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', signData.upload_preset);

      const clUrl = `https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`;
      const response = await fetch(clUrl, { method: 'POST', body: formData });
      const uploadResult = await response.json();

      if (uploadResult.secure_url) {
        onChange(uploadResult.secure_url, uploadResult.public_id || '');
      } else {
        setError(uploadResult.error?.message || 'Upload failed');
      }
    } catch (err: any) {
      console.error(err);
      setError('Network error during upload');
    } finally {
      setUploading(false);
    }
  };

  const inputId = `img-upload-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="space-y-3">
      <label className="text-xs font-semibold text-foreground/60 block uppercase tracking-wider">{label}</label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Upload area */}
        <div className="border-2 border-dashed border-[#C3AB84]/40 rounded-2xl p-5 flex flex-col items-center justify-center bg-[#F8F4EE]/60 hover:bg-[#F8F4EE] transition-colors cursor-pointer">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id={inputId}
          />
          <label htmlFor={inputId} className="cursor-pointer flex flex-col items-center gap-2 w-full text-center">
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-[#0F3D30]" />
            ) : (
              <ImageIcon className="w-6 h-6 text-[#C3AB84]" />
            )}
            <span className="text-xs font-semibold text-[#0F3D30]">
              {uploading ? 'Uploading...' : 'Click to upload via Cloudinary'}
            </span>
            <span className="text-[10px] text-foreground/40">PNG, JPG, WEBP up to 10MB</span>
          </label>
          {error && <p className="text-[10px] text-red-500 mt-2 text-center">{error}</p>}
        </div>

        {/* URL input */}
        <div className="flex flex-col justify-center gap-2">
          <label className="text-[10px] font-semibold text-foreground/50 uppercase tracking-wider">Or paste URL directly</label>
          <input
            type="url"
            placeholder="https://..."
            value={imageUrl}
            onChange={e => onChange(e.target.value, '')}
            className="w-full border border-[#C3AB84]/30 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0F3D30] bg-[#F8F4EE] transition-colors"
          />
          {imagePublicId && (
            <p className="text-[10px] text-foreground/40 font-mono truncate">ID: {imagePublicId}</p>
          )}
        </div>
      </div>

      {/* Preview */}
      {imageUrl && (
        <div className="relative inline-block">
          <img
            src={imageUrl}
            alt={label}
            className="h-28 w-44 object-cover rounded-xl border border-[#C3AB84]/20 shadow-sm"
          />
          <button
            type="button"
            onClick={() => onChange('', '')}
            className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 shadow"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
