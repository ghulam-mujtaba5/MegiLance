// @AI-HINT: MINIMAL CLIENT ROOT FOR TESTING
'use client';

import React from 'react';

const ClientRoot: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div>{children}</div>;
};

export default ClientRoot;
