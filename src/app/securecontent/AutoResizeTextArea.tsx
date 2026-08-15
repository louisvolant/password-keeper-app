// src/app/securecontent/AutoResizeTextArea.tsx
import { useEffect, useRef, useCallback } from 'react';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

interface AutoResizeTextAreaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
  showPreview?: boolean;
}

export const AutoResizeTextArea = ({
  value,
  onChange,
  placeholder,
  className = '',
  minHeight = 128,
  showPreview = false,
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

  const sanitizedHtml = showPreview
    ? sanitizeHtml(marked.parse(value, { async: false }) as string, {
        allowedTags: [
          'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'a',
          'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'code', 'pre', 'blockquote', 'hr',
        ],
        allowedAttributes: {
          a: ['href', 'target', 'rel'],
        },
        selfClosing: ['br', 'hr'],
        transformTags: {
          a: (tagName, attribs) => ({
            tagName,
            attribs: {
              ...attribs,
              target: '_blank',
              rel: 'noopener noreferrer',
            },
          }),
        },
      })
    : '';

  return (
    <div>
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
          font-sans text-base
          ${className}
        `}
        style={{ minHeight: `${minHeight}px` }}
      />
      {showPreview && (
        <div
          className="mt-2 p-2 border rounded bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-sans text-base"
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
      )}
    </div>
  );
};