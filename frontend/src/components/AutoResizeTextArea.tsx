// src/components/AutoResizeTextArea.tsx
import { useEffect, useRef, useCallback } from 'react';

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

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.max(textarea.scrollHeight, minHeight);
      textarea.style.height = `${newHeight}px`;
    }
  }, [minHeight]);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => {
        onChange(e);
        adjustHeight();
      }}
      placeholder={placeholder}
      className={`
        w-full p-2 border rounded resize-none transition-all duration-200
        bg-white dark:bg-gray-700
        text-gray-900 dark:text-gray-100
        placeholder-gray-500 dark:placeholder-gray-400
        border-gray-300 dark:border-gray-600
        focus:border-blue-500 dark:focus:border-blue-400
        focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400
        ${className}
      `}
      style={{ minHeight: `${minHeight}px` }}
    />
  );
};