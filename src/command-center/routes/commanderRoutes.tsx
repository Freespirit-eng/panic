import React from 'react';
import DashboardPage from '../pages/DashboardPage';
import IncidentFeedPage from '../pages/IncidentFeedPage';
import DispatchConsolePage from '../pages/DispatchConsolePage';
import GisMapPage from '../pages/GisMapPage';
import BroadcastRegulatorPage from '../pages/BroadcastRegulatorPage';

export const commanderRoutes = [
  {
    path: 'dashboard',
    element: <DashboardPage />
  },
  {
    path: 'incidents',
    element: <IncidentFeedPage />
  },
  {
    path: 'dispatch',
    element: <DispatchConsolePage />
  },
  {
    path: 'map',
    element: <GisMapPage />
  },
  {
    path: 'broadcast',
    element: <BroadcastRegulatorPage />
  }
];
