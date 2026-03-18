import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { EfficiencyChart } from './components/EfficiencyChart';
import { CompanyPage } from './components/CompanyPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<EfficiencyChart />} />
          <Route path="/company/:slug" element={<CompanyPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
