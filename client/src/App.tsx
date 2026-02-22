import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Towns from './pages/Towns';
import TownDetail from './pages/TownDetail';
import Wars from './pages/Wars';
import WarDetail from './pages/WarDetail';
import Espionage from './pages/Espionage';
import Trade from './pages/Trade';
import Legal from './pages/Legal';
import CaseDetail from './pages/CaseDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="towns" element={<Towns />} />
        <Route path="towns/:id" element={<TownDetail />} />
        <Route path="wars" element={<Wars />} />
        <Route path="wars/:id" element={<WarDetail />} />
        <Route path="espionage" element={<Espionage />} />
        <Route path="trade" element={<Trade />} />
        <Route path="legal" element={<Legal />} />
        <Route path="legal/:id" element={<CaseDetail />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
