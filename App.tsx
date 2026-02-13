import React from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import PortalLanding from './views/PortalLanding';
import SimpdbApp from './views/SimpdbApp';
import MonevApp from './views/MonevApp';
import AssetApp from './views/AssetApp';
import HRApp from './views/HRApp';
import AcademicApp from './views/AcademicApp';
import OfficeApp from './views/OfficeApp';
import WorkshopApp from './views/WorkshopApp';

const App: React.FC = () => {
  const navigate = useNavigate();

  // Helper untuk kembali ke halaman utama
  const goBack = () => navigate('/');

  return (
    <Routes>
      <Route path="/" element={<PortalLanding onSelectApp={(id) => navigate(`/${id}`)} />} />
      
      {/* Route Aplikasi Internal */}
      <Route path="/simpdb/*" element={<SimpdbApp onBackToPortal={goBack} />} />
      <Route path="/monev/*" element={<MonevApp onBack={goBack} />} />
      <Route path="/asset/*" element={<AssetApp onBack={goBack} />} />
      <Route path="/hr/*" element={<HRApp onBack={goBack} />} />
      <Route path="/academic/*" element={<AcademicApp onBack={goBack} />} />
      <Route path="/office/*" element={<OfficeApp onBack={goBack} />} />
      <Route path="/workshop/*" element={<WorkshopApp onBack={goBack} />} />

      {/* Fallback untuk route yang tidak dikenal */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;