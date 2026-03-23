import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { EfficiencyChart } from './components/EfficiencyChart';
import './App.css';

const CompanyPage = lazy(() => import('./components/CompanyPage').then(m => ({ default: m.CompanyPage })));
const ComparePage = lazy(() => import('./components/ComparePage').then(m => ({ default: m.ComparePage })));
const CardPage = lazy(() => import('./components/CardPage').then(m => ({ default: m.CardPage })));
const AboutPage = lazy(() => import('./components/AboutPage').then(m => ({ default: m.AboutPage })));
const SectorPage = lazy(() => import('./components/SectorPage').then(m => ({ default: m.SectorPage })));

function LoadingSpinner() {
  return (
    <div className="loading-spinner-container">
      <div className="loading-spinner" />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<EfficiencyChart />} />
            <Route path="/charts" element={<EfficiencyChart defaultView="scatter" />} />
            <Route path="/company/:slug" element={<CompanyPage />} />
            <Route path="/compare/:slugs" element={<ComparePage />} />
            <Route path="/card/:slug" element={<CardPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/vertical/:categoryId" element={<SectorPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  );
}

export default App;
