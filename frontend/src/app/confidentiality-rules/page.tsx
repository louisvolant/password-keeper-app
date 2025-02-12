// src/app/confidentiality-rules/page.tsx
'use client';
import { Header } from '@/components/Header';


export default function ConfidentialityRulesPage() {
  return (
      <div>
        <Header isAuthenticated={false} />
        <div className="container mx-auto p-4 max-w-2xl">
          <h1 className="text-3xl font-bold mb-4">Confidentiality Rules</h1>

          <p className="mb-4">
            We are committed to protecting your privacy. This page outlines our
            confidentiality rules and how we handle your data.
          </p>

          {/* Add your confidentiality rules here */}
          <ul className="list-disc pl-6 mb-4">
            <li>We do not share your personal information with third parties without your consent.</li>
            <li>Your data is encrypted and stored securely.</li>
            <li>We use your data only for the purpose of providing and improving our services.</li>
            {/* ... more rules */}
          </ul>

          <p className="mb-4">
            For more information, please contact us at contact [at] pioo.fr.
          </p>
        </div>
    </div>
  );
}
