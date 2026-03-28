import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { logout } from '../lib/firebase';
import { Activity, FileSearch, Calculator, LogOut, Baby } from 'lucide-react';
import { clsx } from 'clsx';

export default function Navbar() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Activity },
    { path: '/search', label: 'Drug Search', icon: FileSearch },
    { path: '/neonatal-search', label: 'Neonatal Search', icon: Baby },
    { path: '/renal-search', label: 'Renal Dose', icon: Activity },
    { path: '/calculator', label: 'Dose Calculator', icon: Calculator },
  ];

  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Activity className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-xl font-semibold tracking-tight text-slate-900">DoseCheck AI</span>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={clsx(
                      'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium',
                      isActive
                        ? 'border-indigo-500 text-slate-900'
                        : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                    )}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center">
            <button
              onClick={logout}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-slate-500 hover:text-slate-700 focus:outline-none transition"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
