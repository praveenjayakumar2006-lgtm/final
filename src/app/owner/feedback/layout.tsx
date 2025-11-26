
import React from 'react';

export default function OwnerFeedbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
     <div className="flex flex-1 flex-col">
        {children}
    </div>
  );
}
