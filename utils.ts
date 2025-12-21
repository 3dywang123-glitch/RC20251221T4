
import React from 'react';
import html2canvas from 'html2canvas';

export const getAvatarSrc = (input?: string) => {
  if (!input) return '';
  if (input.startsWith('data:') || input.startsWith('http') || input.includes('.') || input.includes('/')) {
    return input;
  }
  return `data:image/jpeg;base64,${input}`;
};

export const handleImageUploadHelper = (e: React.ChangeEvent<HTMLInputElement>, callback: (b64: string) => void) => {
  const file = e.target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onloadend = () => {
      const b64 = reader.result as string;
      callback(b64);
    };
    reader.readAsDataURL(file);
  }
};

export const downloadElementAsImage = async (element: HTMLElement, filename: string): Promise<boolean> => {
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();

    return true;
  } catch (error) {
    console.error('Failed to download element as image:', error);
    return false;
  }
};
