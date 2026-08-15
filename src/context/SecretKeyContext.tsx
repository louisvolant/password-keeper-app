// src/context/SecretKeyContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';

interface SecretKeyContextType {
  secretKey: string;
  setSecretKey: (key: string) => void;
}

const SecretKeyContext = createContext<SecretKeyContextType | undefined>(undefined);

export const SecretKeyProvider = ({ children }: { children: ReactNode }) => {
  const [secretKey, setSecretKey] = useState('');

  return (
    <SecretKeyContext.Provider value={{ secretKey, setSecretKey }}>
      {children}
    </SecretKeyContext.Provider>
  );
};

export const useSecretKey = () => {
  const context = useContext(SecretKeyContext);
  if (!context) {
    throw new Error('useSecretKey must be used within a SecretKeyProvider');
  }
  return context;
};