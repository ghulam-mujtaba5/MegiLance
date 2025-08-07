// @AI-HINT: This is the chrome-less layout for authentication pages like login and signup. It intentionally omits the main site header and footer to provide a focused user experience.

import React from 'react';

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      {children}
    </div>
  );
}
