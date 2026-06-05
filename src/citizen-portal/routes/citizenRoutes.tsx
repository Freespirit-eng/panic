import React from 'react';
import ReportingPage from '../pages/ReportingPage';
import VolunteerStandbyPage from '../pages/VolunteerStandbyPage';
import CitizenChatPage from '../pages/CitizenChatPage';
import EmergencyDirectoryPage from '../pages/EmergencyDirectoryPage';

export const citizenRoutes = [
  {
    path: 'report',
    element: <ReportingPage />
  },
  {
    path: 'volunteer',
    element: <VolunteerStandbyPage />
  },
  {
    path: 'chat',
    element: <CitizenChatPage />
  },
  {
    path: 'directory',
    element: <EmergencyDirectoryPage />
  }
];
