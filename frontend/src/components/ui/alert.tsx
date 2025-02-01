// src/components/ui/alert.tsx
interface AlertProps {
  children: React.ReactNode;
  variant?: 'default' | 'error';
  className?: string;
}

export const Alert = ({ children, variant = 'default', className = '' }: AlertProps) => {
  const variants = {
    default: 'bg-blue-50 border-blue-200 text-blue-800',
    error: 'bg-red-50 border-red-200 text-red-800'
  };

  return (
    <div className={`p-4 border rounded-md ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
};

export const AlertDescription = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  return <div className={`text-sm ${className}`}>{children}</div>;
};

