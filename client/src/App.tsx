import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { LoadingSpinner } from './components/UI';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Towns = lazy(() => import('./pages/Towns'));
const TownDetail = lazy(() => import('./pages/TownDetail'));
const Wars = lazy(() => import('./pages/Wars'));
const WarDetail = lazy(() => import('./pages/WarDetail'));
const Espionage = lazy(() => import('./pages/Espionage'));
const Trade = lazy(() => import('./pages/Trade'));
const Legal = lazy(() => import('./pages/Legal'));
const CaseDetail = lazy(() => import('./pages/CaseDetail'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const NotFound = lazy(() => import('./pages/NotFound'));

export default function App() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><LoadingSpinner /></div>}>
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
    </Suspense>
  );
}
