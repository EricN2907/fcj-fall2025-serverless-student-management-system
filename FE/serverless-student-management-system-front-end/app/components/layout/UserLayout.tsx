import React from 'react';
import { Outlet } from 'react-router';
import Navbar from './navbar';
import Footer from './footer';

/**
 * UserLayout - Layout for Student, Lecturer, and Common pages
 * This layout includes Navbar, main content area, and Footer
 */
const UserLayout: React.FC = () => {
  return (
    <div className="layout min-h-screen flex flex-col">
      <Navbar />
      <main className="layout-content flex-1">
        <div className="container">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UserLayout;
