import React from 'react';
import { Outlet } from 'react-router-dom';
import PortalLayout from './PortalLayout.jsx';
import './MainLayout.css';

export const MainLayout = () => {
  return (
    <PortalLayout>
      <Outlet />
    </PortalLayout>
  );
};

export default MainLayout;
