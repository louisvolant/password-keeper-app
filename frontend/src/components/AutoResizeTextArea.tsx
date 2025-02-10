// src/components/AutoResizeTextArea.tsx
import { useEffect, useRef } from 'react';

interface AutoResizeTextAreaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
}

export const AutoResizeTextArea = ({
  value,
  onChange,
  placeholder,
  className = '',
  minHeight = 128, // 32px * 4 lines as default minimum height
}: AutoResizeTextAreaProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to allow shrinking
      textarea.style.height = 'auto';
      // Set new height based on scrollHeight
      const newHeight = Math.max(textarea.scrollHeight, minHeight);
      textarea.style.height = `${newHeight}px`;
    }
  };

  // Adjust height when value changes
  useEffect(() => {
    adjustHeight();
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => {
        onChange(e);
        adjustHeight();
      }}
      placeholder={placeholder}
      className={`w-full p-2 border rounded resize-none transition-height duration-200 ${className}`}
      style={{ minHeight: `${minHeight}px` }}
    />
  );
};