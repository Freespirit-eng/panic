import React, { useState } from 'react';
import { citizenRoutes } from './citizen-portal/routes/citizenRoutes';
import { commanderRoutes } from './command-center/routes/commanderRoutes';

export default function App() {
  const [appMode, setAppMode] = useState<'command' | 'citizen'>('citizen');
  const [currentPath, setCurrentPath] = useState<string>('report');

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
  };

  // Resolve active page component based on simple path routing state
  const renderActiveRoute = () => {
    if (appMode === 'citizen') {
      const route = citizenRoutes.find(r => r.path === currentPath);
      return route ? route.element : <div className="text-white">Citizen Portal Route Not Found</div>;
    } else {
      const route = commanderRoutes.find(r => r.path === currentPath);
      return route ? route.element : <div className="text-white">Command Center Route Not Found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1220] flex flex-col font-sans text-gray-200">
      <header className="sticky top-0 bg-[#0B1220] border-b border-gray-800 px-4 h-16 flex items-center justify-between z-40">
        <h1 className="text-sm font-black text-white tracking-widest font-mono">
          PANIC SENSE <span className="text-blue-500 font-extrabold text-[11px] bg-blue-950 px-1 border border-blue-900 rounded">CORE</span>
        </h1>
        
        {/* Module Switcher Tab Headers */}
        <div className="flex bg-gray-950 border border-gray-850 p-1 rounded-lg select-none gap-1">
          <button
            onClick={() => {
              setAppMode('citizen');
              setCurrentPath('report');
            }}
            className={`py-1.5 px-3 text-xs font-mono font-bold rounded transition ${
              appMode === 'citizen' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            CITIZEN PORTAL
          </button>
          <button
            onClick={() => {
              setAppMode('command');
              setCurrentPath('dashboard');
            }}
            className={`py-1.5 px-3 text-xs font-mono font-bold rounded transition ${
              appMode === 'command' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            COMMAND CENTER
          </button>
        </div>
      </header>

      {/* Navigation Sub-bar based on Active Module */}
      <nav className="bg-[#111827] border-b border-gray-800 px-4 py-2 flex gap-4 text-xs font-mono">
        {appMode === 'citizen' ? (
          <>
            <button onClick={() => handleNavigate('report')} className={`hover:text-white ${currentPath === 'report' ? 'text-green-400 font-bold' : 'text-gray-400'}`}>[01 // REPORT]</button>
            <button onClick={() => handleNavigate('volunteer')} className={`hover:text-white ${currentPath === 'volunteer' ? 'text-green-400 font-bold' : 'text-gray-400'}`}>[02 // VOLUNTEER]</button>
            <button onClick={() => handleNavigate('chat')} className={`hover:text-white ${currentPath === 'chat' ? 'text-green-400 font-bold' : 'text-gray-400'}`}>[03 // ASSISTANT CHAT]</button>
            <button onClick={() => handleNavigate('directory')} className={`hover:text-white ${currentPath === 'directory' ? 'text-green-400 font-bold' : 'text-gray-400'}`}>[04 // DIRECTORY]</button>
          </>
        ) : (
          <>
            <button onClick={() => handleNavigate('dashboard')} className={`hover:text-white ${currentPath === 'dashboard' ? 'text-blue-400 font-bold' : 'text-gray-400'}`}>[01 // OVERVIEW]</button>
            <button onClick={() => handleNavigate('incidents')} className={`hover:text-white ${currentPath === 'incidents' ? 'text-blue-400 font-bold' : 'text-gray-400'}`}>[02 // LIVE FEED]</button>
            <button onClick={() => handleNavigate('dispatch')} className={`hover:text-white ${currentPath === 'dispatch' ? 'text-blue-400 font-bold' : 'text-gray-400'}`}>[03 // DISPATCH]</button>
            <button onClick={() => handleNavigate('map')} className={`hover:text-white ${currentPath === 'map' ? 'text-blue-400 font-bold' : 'text-gray-400'}`}>[04 // GIS MAP]</button>
            <button onClick={() => handleNavigate('broadcast')} className={`hover:text-white ${currentPath === 'broadcast' ? 'text-blue-400 font-bold' : 'text-gray-400'}`}>[05 // BROADCASTS]</button>
          </>
        )}
      </nav>

      <main className="flex-1 p-4 overflow-y-auto">
        {renderActiveRoute()}
      </main>
    </div>
  );
}
