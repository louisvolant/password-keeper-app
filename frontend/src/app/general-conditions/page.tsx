// src/app/general-conditions/page.tsx
'use client';
import { Header } from '@/components/Header';

const domain = process.env.NEXT_PUBLIC_DOMAIN_URL;

export default function GeneralConditionsPage() {
  const contactEmail = `contact [at] ${domain}`; // Construct the email

  return (
      <div>
        <Header isAuthenticated={false} />
        <div className="container mx-auto p-4 max-w-2xl">
          <h1 className="text-3xl font-bold mb-4">General Conditions</h1>

          <p className="mb-4">
            Please read these general conditions carefully before using our app.
          </p>

          <ol className="list-decimal pl-6 mb-4">
            <li><strong>Acceptance of Terms:</strong> By using this app, you agree to be bound by these terms and conditions.</li>
            <li><strong>Use of the App:</strong> You may use the app only for lawful purposes and in accordance with these terms.</li>
            <li><strong>Intellectual Property:</strong> The content of this app is protected by copyright and other intellectual property laws.</li>
          </ol>

          <p className="mb-4">
            If you have any questions, please contact us at {contactEmail}.
          </p>
        </div>
    </div>
  );
}
