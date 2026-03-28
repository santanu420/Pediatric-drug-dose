import React, { useState, useEffect, useRef } from 'react';
import { searchRenalDrug, suggestDrugs } from '../lib/gemini';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, CheckCircle2, AlertCircle, Search as SearchIcon, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function RenalSearch() {
  const { user } = useAuth();
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      const results = await suggestDrugs(searchQuery, false);
      setSuggestions(results);
      setShowSuggestions(true);
      setIsLoadingSuggestions(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = async (e?: React.FormEvent, queryToSearch?: string) => {
    if (e) e.preventDefault();
    
    const finalQuery = queryToSearch || searchQuery;
    if (!finalQuery.trim()) {
      toast.error('Please enter a drug name to search');
      return;
    }

    setShowSuggestions(false);
    setIsSearching(true);
    setResult(null);

    try {
      const searchResult = await searchRenalDrug(finalQuery);
      setResult(searchResult);

      if (user && searchResult.drugName) {
        await addDoc(collection(db, 'renalSearches'), {
          userId: user.uid,
          searchQuery: finalQuery,
          drugName: searchResult.drugName || '',
          normalDose: searchResult.normalDose || '',
          renalImpairment: searchResult.renalImpairment || '',
          hd: searchResult.hd || '',
          pd: searchResult.pd || '',
          cvvh: searchResult.cvvh || '',
          notes: searchResult.notes || '',
          createdAt: serverTimestamp()
        });
        toast.success('Search saved successfully');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to search drug. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    handleSearch(undefined, suggestion);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center">
          <Activity className="h-8 w-8 mr-3 text-indigo-600" />
          Renal Dose Modification
        </h1>
        <p className="mt-2 text-slate-500">Search for paediatric drug dosage adjustments in patients with renal impairment or on renal replacement therapies (based on GOSH guidelines).</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
        <form onSubmit={(e) => handleSearch(e)} className="flex space-x-4">
          <div className="flex-1 relative" ref={suggestionRef}>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Enter drug name (e.g., Amikacin)"
              className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
            />
            
            <AnimatePresence>
              {showSuggestions && (suggestions.length > 0 || isLoadingSuggestions) && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden"
                >
                  {isLoadingSuggestions && suggestions.length === 0 ? (
                    <div className="p-4 text-sm text-slate-500 flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading suggestions...
                    </div>
                  ) : (
                    <ul className="max-h-60 overflow-auto py-1">
                      {suggestions.map((suggestion, index) => (
                        <li 
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="px-4 py-2 hover:bg-indigo-50 cursor-pointer text-sm text-slate-700 transition-colors"
                        >
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            type="submit"
            disabled={!searchQuery.trim() || isSearching}
            className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Search'}
          </button>
        </form>
      </div>

      {result && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 mr-2" />
              Renal Search Results
            </h3>
          </div>
          <div className="p-6">
            {result.drugName ? (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-slate-500">Drug Name Found</dt>
                  <dd className="mt-1 text-lg font-semibold text-slate-900">{result.drugName}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-slate-500">Normal Dose</dt>
                  <dd className="mt-1 text-base text-slate-900 whitespace-pre-wrap">{result.normalDose || 'Not specified'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-slate-500">Dose Adjustment in Renal Impairment</dt>
                  <dd className="mt-1 text-base text-slate-900 whitespace-pre-wrap">{result.renalImpairment || 'Not specified'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Dose Adjustment in HD</dt>
                  <dd className="mt-1 text-base text-slate-900 whitespace-pre-wrap">{result.hd || 'Not specified'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Dose Adjustment in PD</dt>
                  <dd className="mt-1 text-base text-slate-900 whitespace-pre-wrap">{result.pd || 'Not specified'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-slate-500">Dose Adjustment in CVVH</dt>
                  <dd className="mt-1 text-base text-slate-900 whitespace-pre-wrap">{result.cvvh || 'Not specified'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-slate-500">Notes / Warnings</dt>
                  <dd className="mt-1 text-base text-slate-900 bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-start">
                    <AlertCircle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="whitespace-pre-wrap">{result.notes || 'No special notes found.'}</span>
                  </dd>
                </div>
              </dl>
            ) : (
              <div className="text-center py-6">
                <AlertCircle className="h-12 w-12 text-amber-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-slate-900">Drug Not Found</h3>
                <p className="text-slate-500 mt-1">Could not find "{searchQuery}" in the knowledge base.</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
