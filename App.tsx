import React, { useState } from 'react';
import PortalLanding from './views/PortalLanding';
import SimpdbApp from './views/SimpdbApp';
import MonevApp from './views/MonevApp';
import AssetApp from './views/AssetApp';
import HRApp from './views/HRApp';
import AcademicApp from './views/AcademicApp';
import OfficeApp from './views/OfficeApp';
import WorkshopApp from './views/WorkshopApp';

const App: React.FC = () => {
  const [currentApp, setCurrentApp] = useState<string | null>(null);

  // Render Portal if no app is selected
  if (!currentApp) {
    return <PortalLanding onSelectApp={setCurrentApp} />;
  }

  const goBack = () => setCurrentApp(null);

  // Router Switch
  switch (currentApp) {
    case 'simpdb':
      return <SimpdbApp onBackToPortal={goBack} />;
    case 'monev': // Replaces finance
      return <MonevApp onBack={goBack} />;
    case 'asset':
      return <AssetApp onBack={goBack} />;
    case 'hr':
      return <HRApp onBack={goBack} />;
    case 'academic':
      return <AcademicApp onBack={goBack} />;
    case 'office':
      return <OfficeApp onBack={goBack} />;
    case 'workshop':
      return <WorkshopApp onBack={goBack} />;
    default:
      return <PortalLanding onSelectApp={setCurrentApp} />;
  }
};

export default App;