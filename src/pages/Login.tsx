import React, { useState } from 'react';
import { loginWithGoogle } from '../lib/firebase';
import { Activity, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Sign-in popup was closed before completing.');
      } else if (error.code === 'auth/unauthorized-domain') {
        toast.error('This domain is not authorized. Please add it to Firebase Console > Authentication > Settings > Authorized domains.');
      } else if (error.message?.includes('Cross-Origin-Opener-Policy')) {
        toast.error('Please open the app in a new tab (top right icon) to sign in.');
      } else {
        toast.error(error.message || 'Failed to sign in. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl"
      >
        <div>
          <div className="mx-auto h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center">
            <Activity className="h-8 w-8 text-indigo-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
            DoseCheck AI
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Intelligent drug dose calculator and document analyzer
          </p>
        </div>
        <div className="mt-8">
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors shadow-md disabled:opacity-70"
          >
            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Sign in with Google'}
          </button>
          <p className="mt-4 text-center text-xs text-slate-500">
            If sign-in fails, try opening the app in a new tab using the icon in the top right corner.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
