import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar.jsx';
import Footer from '../components/Footer/Footer.jsx';
import NotificationToastContainer from '../components/NotificationToast/NotificationToast.jsx';
import './PublicLayout.css';

export const PublicLayout = () => {
  return (
    <div className="public-page-layout">
      <Navbar />
      <main className="public-page-content">
        <Outlet />
      </main>
      <Footer />
      <NotificationToastContainer />
    </div>
  );
};

export default PublicLayout;
