// @AI-HINT: This is a reusable placeholder component for pages that are under construction.

import React from 'react';
import './PlaceholderPage.common.css';

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, description }) => {
  return (
    <div className="PlaceholderPage">
      <div className="PlaceholderPage-content">
        <h1 className="PlaceholderPage-title">{title}</h1>
        <p className="PlaceholderPage-description">
          {description || 'This page is under construction. Content will be added soon.'}
        </p>
      </div>
    </div>
  );
};

export default PlaceholderPage;
