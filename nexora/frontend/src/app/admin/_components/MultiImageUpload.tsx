"use client";

import React, { useState } from 'react';
import { ImageIcon, X, Loader2, Plus } from 'lucide-react';
import api from '@/lib/api';

interface MultiImageUploadProps {
  imageUrls: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  folder?: string;
}

export default function MultiImageUpload({
  imageUrls = [],
  onChange,
  label = 'Images',
  folder = 'nexora/general',
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [inputUrl, setInputUrl] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setError('');

    try {
      const { data: signData } = await api.post('/upload/upload-signature');
      if (!signData.success) {
        setError('Failed to get secure upload credentials');
        return;
      }

      const clUrl = `https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`;
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', signData.upload_preset);

        const response = await fetch(clUrl, { method: 'POST', body: formData });
        const uploadResult = await response.json();

        if (uploadResult.secure_url) {
          uploadedUrls.push(uploadResult.secure_url);
        } else {
          setError(uploadResult.error?.message || 'Some uploads failed');
        }
      }

      if (uploadedUrls.length > 0) {
        onChange([...imageUrls, ...uploadedUrls]);
      }
    } catch (err: any) {
      console.error(err);
      setError('Network error during upload');
    } finally {
      setUploading(false);
    }
  };

  const handleAddUrl = () => {
    if (!inputUrl.trim()) return;
    onChange([...imageUrls, inputUrl.trim()]);
    setInputUrl('');
  };

  const handleRemoveImage = (indexToRemove: number) => {
    onChange(imageUrls.filter((_, idx) => idx !== indexToRemove));
  };

  const inputId = `multi-img-upload-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="space-y-3">
      <label className="text-xs font-semibold text-foreground/60 block uppercase tracking-wider">{label}</label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Upload area */}
        <div className="border-2 border-dashed border-[#C3AB84]/40 rounded-2xl p-5 flex flex-col items-center justify-center bg-[#F8F4EE]/60 hover:bg-[#F8F4EE] transition-colors cursor-pointer">
          <input
            type="file"
            accept="image/*"
            multiple
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
              {uploading ? 'Uploading...' : 'Upload multiple via Cloudinary'}
            </span>
            <span className="text-[10px] text-foreground/40">PNG, JPG, WEBP up to 10MB</span>
          </label>
          {error && <p className="text-[10px] text-red-500 mt-2 text-center">{error}</p>}
        </div>

        {/* URL input */}
        <div className="flex flex-col justify-center gap-2">
          <label className="text-[10px] font-semibold text-foreground/50 uppercase tracking-wider">Or paste direct URL</label>
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://..."
              value={inputUrl}
              onChange={e => setInputUrl(e.target.value)}
              className="flex-1 border border-[#C3AB84]/30 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0F3D30] bg-[#F8F4EE] transition-colors"
            />
            <button
              type="button"
              onClick={handleAddUrl}
              className="px-4 bg-[#0F3D30] hover:bg-[#0F3D30]/90 text-white rounded-2xl flex items-center justify-center transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 text-[#C3AB84]" />
            </button>
          </div>
        </div>
      </div>

      {/* Preview thumbnails list */}
      {imageUrls.length > 0 && (
        <div className="flex flex-wrap gap-3 pt-2">
          {imageUrls.map((url, index) => (
            <div key={index} className="relative inline-block group">
              <img
                src={url}
                alt={`${label}-${index}`}
                className="h-16 w-24 object-cover rounded-xl border border-[#C3AB84]/20 shadow-sm transition-transform duration-200 group-hover:scale-[1.02]"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 shadow"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
