// This file defines the layout structure of the application. It sets up the overall UI components and styling for the chat interface.

import React from 'react';

const Layout = ({ children }) => {
  return (
    <div className="layout-container">
      <header className="layout-header">
        <h1>MediBot Chat</h1>
      </header>
      <main className="layout-main">
        {children}
      </main>
      <footer className="layout-footer">
        <p>&copy; 2023 MediBot. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Layout;