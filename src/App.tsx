/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Search from './pages/Search';
import NeonatalSearch from './pages/NeonatalSearch';
import RenalSearch from './pages/RenalSearch';
import Calculator from './pages/Calculator';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/search" element={<Search />} />
            <Route path="/neonatal-search" element={<NeonatalSearch />} />
            <Route path="/renal-search" element={<RenalSearch />} />
            <Route path="/calculator" element={<Calculator />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
