import React from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';

const SEOProvider = ({ children }) => {
  return (
    <HelmetProvider>
      <Helmet>
        <title>High Life Auto - Cheap Cars Fort Madison | Used Trucks Burlington IA</title>
        <meta name="description" content="High Life Auto: The most honest used car dealer in Fort Madison, IA. We sell cheap cars, used trucks, and debt-free freedom machines. No dealer fees." />
        <meta name="keywords" content="Cheap cars Fort Madison, Used trucks Burlington IA, High Life Auto inventory, used cars under 5000, reliable used cars iowa" />
        <meta property="og:title" content="High Life Auto - Drive Debt-Free" />
        <meta property="og:description" content="Honest cars at honest prices. Watch our test drives on YouTube." />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:site_name" content="High Life Auto" />
      </Helmet>
      {children}
    </HelmetProvider>
  );
};

export default SEOProvider;
