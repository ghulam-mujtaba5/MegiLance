// @AI-HINT: This is the main Dashboard page component. It serves as the landing page after a user logs in and is rendered within the DashboardLayout.

import React from 'react';

const DashboardPage = () => {
  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Dashboard</h1>
      <p>Welcome to your MegiLance dashboard. This is the main content area where your dashboard widgets and information will be displayed.</p>
      <p>The sidebar to the left provides navigation to all key areas of the application.</p>
    </div>
  );
};

export default DashboardPage;
