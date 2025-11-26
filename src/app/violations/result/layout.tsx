
import React from 'react';

export default function ViolationsResultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <div className="container mx-auto px-4 md:px-6 flex-1 flex items-center justify-center py-8">
        {children}
      </div>
    </div>
  );
}
