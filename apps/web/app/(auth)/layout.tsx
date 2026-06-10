import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-base min-h-screen flex items-center justify-center p-4 antialiased selection:bg-primary selection:text-white">
      {children}
    </div>
  );
}
