import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { FileSearch, Calculator, ArrowRight, Clock, BookOpen, Baby, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { user } = useAuth();
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const [recentCalculations, setRecentCalculations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const searchesQuery = query(
          collection(db, 'searches'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(3)
        );
        const calcQuery = query(
          collection(db, 'calculations'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(3)
        );

        const [searchesSnap, calcSnap] = await Promise.all([
          getDocs(searchesQuery),
          getDocs(calcQuery)
        ]);

        setRecentSearches(searchesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setRecentCalculations(calcSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'searches/calculations');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back, {user?.displayName?.split(' ')[0] || 'User'}</h1>
        <p className="mt-2 text-slate-500">What would you like to do today?</p>
        
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Link to="/search" className="group relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all hover:border-indigo-500">
            <div className="flex items-center space-x-4">
              <div className="bg-indigo-50 p-3 rounded-xl group-hover:bg-indigo-100 transition-colors">
                <FileSearch className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Drug Search</h3>
                <p className="text-sm text-slate-500">Search drug doses in formularies</p>
              </div>
            </div>
            <div className="absolute top-6 right-6 text-slate-400 group-hover:text-indigo-600 transition-colors">
              <ArrowRight className="h-5 w-5" />
            </div>
          </Link>

          <Link to="/neonatal-search" className="group relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all hover:border-blue-500">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-50 p-3 rounded-xl group-hover:bg-blue-100 transition-colors">
                <Baby className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Neonatal Search</h3>
                <p className="text-sm text-slate-500">Search doses in a neonatal PDF</p>
              </div>
            </div>
            <div className="absolute top-6 right-6 text-slate-400 group-hover:text-blue-600 transition-colors">
              <ArrowRight className="h-5 w-5" />
            </div>
          </Link>

          <Link to="/renal-search" className="group relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all hover:border-amber-500">
            <div className="flex items-center space-x-4">
              <div className="bg-amber-50 p-3 rounded-xl group-hover:bg-amber-100 transition-colors">
                <Activity className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Renal Dose</h3>
                <p className="text-sm text-slate-500">Search renal dose modifications</p>
              </div>
            </div>
            <div className="absolute top-6 right-6 text-slate-400 group-hover:text-amber-600 transition-colors">
              <ArrowRight className="h-5 w-5" />
            </div>
          </Link>

          <Link to="/calculator" className="group relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all hover:border-emerald-500">
            <div className="flex items-center space-x-4">
              <div className="bg-emerald-50 p-3 rounded-xl group-hover:bg-emerald-100 transition-colors">
                <Calculator className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Dose Calculator</h3>
                <p className="text-sm text-slate-500">Calculate dose by patient weight</p>
              </div>
            </div>
            <div className="absolute top-6 right-6 text-slate-400 group-hover:text-emerald-600 transition-colors">
              <ArrowRight className="h-5 w-5" />
            </div>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-slate-400" />
              Recent Searches
            </h2>
          </div>
          {loading ? (
            <p className="text-slate-500 text-sm">Loading...</p>
          ) : recentSearches.length > 0 ? (
            <div className="space-y-4">
              {recentSearches.map(search => (
                <div key={search.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <h4 className="font-medium text-slate-900">{search.drugName || search.searchQuery}</h4>
                  <p className="text-sm text-slate-500 mt-1">Dose: {search.dosage || 'N/A'}</p>
                  {search.source && (
                    <p className="text-xs text-indigo-600 mt-1 flex items-center">
                      <BookOpen className="w-3 h-3 mr-1" />
                      {search.source}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-2">
                    {new Date(search.createdAt?.toDate?.() || Date.now()).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No recent searches found.</p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-slate-400" />
              Recent Calculations
            </h2>
          </div>
          {loading ? (
            <p className="text-slate-500 text-sm">Loading...</p>
          ) : recentCalculations.length > 0 ? (
            <div className="space-y-4">
              {recentCalculations.map(calc => (
                <div key={calc.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <h4 className="font-medium text-slate-900">{calc.drugName}</h4>
                  <p className="text-sm text-slate-500 mt-1">Weight: {calc.weightKg}kg • Dose: {calc.calculatedDose}</p>
                  <p className="text-xs text-slate-400 mt-2">
                    {new Date(calc.createdAt?.toDate?.() || Date.now()).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No recent calculations found.</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
