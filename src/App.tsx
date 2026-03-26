import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { EfficiencyChart } from './components/EfficiencyChart';
import { categories } from './data/companies';
import './App.css';

const CompanyPage = lazy(() => import('./components/CompanyPage').then(m => ({ default: m.CompanyPage })));
const ComparePage = lazy(() => import('./components/ComparePage').then(m => ({ default: m.ComparePage })));
const CardPage = lazy(() => import('./components/CardPage').then(m => ({ default: m.CardPage })));
const AboutPage = lazy(() => import('./components/AboutPage').then(m => ({ default: m.AboutPage })));
const SectorPage = lazy(() => import('./components/SectorPage').then(m => ({ default: m.SectorPage })));
const CalculatorPage = lazy(() => import('./components/CalculatorPage').then(m => ({ default: m.CalculatorPage })));
const ReportPage = lazy(() => import('./components/ReportPage').then(m => ({ default: m.ReportPage })));

// SEO redirect: /best-healthcare-ai-companies → /vertical/healthcare
const SEO_SLUG_MAP: Record<string, string> = {};
categories.forEach(c => {
  const slug = `best-${c.name.toLowerCase().replace(/\s+/g, '-')}-ai-companies`;
  SEO_SLUG_MAP[slug] = c.id;
});

function SEORedirect() {
  const { slug } = useParams<{ slug: string }>();
  const categoryId = slug ? SEO_SLUG_MAP[slug] : undefined;
  if (categoryId) return <Navigate to={`/vertical/${categoryId}`} replace />;
  return <Navigate to="/" replace />;
}

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
            <Route path="/calculator" element={<CalculatorPage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/report/:month" element={<ReportPage />} />
            <Route path="/vertical/:categoryId" element={<SectorPage />} />
            <Route path="/:slug" element={<SEORedirect />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  );
}

export default App;
