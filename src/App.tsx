import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { EfficiencyChart } from './components/EfficiencyChart';
import { CompanyPage } from './components/CompanyPage';
import { ComparePage } from './components/ComparePage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<EfficiencyChart />} />
          <Route path="/charts" element={<EfficiencyChart defaultView="scatter" />} />
          <Route path="/company/:slug" element={<CompanyPage />} />
          <Route path="/compare/:slugs" element={<ComparePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
