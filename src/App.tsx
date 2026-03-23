import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { EfficiencyChart } from './components/EfficiencyChart';
import { CompanyPage } from './components/CompanyPage';
import { ComparePage } from './components/ComparePage';
import { CardPage } from './components/CardPage';
import { categories } from './data/companies';
import './App.css';

function VerticalPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const validCategory = categories.find(c => c.id === categoryId);
  if (!validCategory) {
    return <Navigate to="/" replace />;
  }
  return <EfficiencyChart defaultCategory={categoryId} />;
}

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<EfficiencyChart />} />
          <Route path="/charts" element={<EfficiencyChart defaultView="scatter" />} />
          <Route path="/company/:slug" element={<CompanyPage />} />
          <Route path="/compare/:slugs" element={<ComparePage />} />
          <Route path="/card/:slug" element={<CardPage />} />
          <Route path="/vertical/:categoryId" element={<VerticalPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
