import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Calculator as CalcIcon, Save, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const SAMPLE_DRUGS = [
  {
    id: 'paracetamol',
    name: 'Paracetamol (Acetaminophen)',
    dosePerKg: 15,
    unit: 'mg',
    frequency: 'every 4-6 hours',
    maxDosePerDay: 4000,
    notes: 'Max 60 mg/kg/day or 4000 mg/day, whichever is less.'
  },
  {
    id: 'amoxicillin',
    name: 'Amoxicillin',
    dosePerKg: 40,
    unit: 'mg',
    frequency: 'divided every 8 hours',
    maxDosePerDay: 3000,
    notes: 'Dose is per day, divided into 3 doses.'
  },
  {
    id: 'ibuprofen',
    name: 'Ibuprofen',
    dosePerKg: 10,
    unit: 'mg',
    frequency: 'every 6-8 hours',
    maxDosePerDay: 2400,
    notes: 'Max 40 mg/kg/day or 2400 mg/day, whichever is less. Take with food.'
  }
];

export default function Calculator() {
  const { user } = useAuth();
  const [weight, setWeight] = useState<string>('');
  const [selectedDrug, setSelectedDrug] = useState<string>(SAMPLE_DRUGS[0].id);
  const [result, setResult] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const weightNum = parseFloat(weight);
    
    if (isNaN(weightNum) || weightNum <= 0 || weightNum > 300) {
      toast.error('Please enter a valid weight between 0 and 300 kg');
      return;
    }

    const drug = SAMPLE_DRUGS.find(d => d.id === selectedDrug);
    if (!drug) return;

    let calculatedDose = 0;
    let doseString = '';

    if (drug.id === 'paracetamol' || drug.id === 'ibuprofen') {
      calculatedDose = weightNum * drug.dosePerKg;
      doseString = `${Math.round(calculatedDose)} ${drug.unit} per dose`;
    } else if (drug.id === 'amoxicillin') {
      calculatedDose = (weightNum * drug.dosePerKg) / 3;
      doseString = `${Math.round(calculatedDose)} ${drug.unit} per dose (Total ${Math.round(weightNum * drug.dosePerKg)} mg/day)`;
    }

    setResult({
      drugName: drug.name,
      weightKg: weightNum,
      calculatedDose: doseString,
      frequency: drug.frequency,
      notes: drug.notes
    });
  };

  const handleSave = async () => {
    if (!user || !result) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'calculations'), {
        userId: user.uid,
        drugName: result.drugName,
        weightKg: result.weightKg,
        calculatedDose: result.calculatedDose,
        frequency: result.frequency,
        createdAt: serverTimestamp()
      });
      toast.success('Calculation saved to dashboard');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'calculations');
      toast.error('Failed to save calculation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dose Calculator</h1>
        <p className="mt-2 text-slate-500">Calculate pediatric and adult drug doses based on patient weight.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <form onSubmit={handleCalculate} className="space-y-6">
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-slate-700">
                Patient Weight (kg)
              </label>
              <div className="mt-2 relative rounded-md shadow-sm">
                <input
                  type="number"
                  name="weight"
                  id="weight"
                  step="0.1"
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-4 pr-12 sm:text-sm border-slate-300 rounded-xl py-3 border bg-slate-50"
                  placeholder="e.g. 25.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <span className="text-slate-500 sm:text-sm">kg</span>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="drug" className="block text-sm font-medium text-slate-700">
                Select Drug
              </label>
              <select
                id="drug"
                name="drug"
                className="mt-2 block w-full pl-3 pr-10 py-3 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-xl border bg-slate-50"
                value={selectedDrug}
                onChange={(e) => setSelectedDrug(e.target.value)}
              >
                {SAMPLE_DRUGS.map((drug) => (
                  <option key={drug.id} value={drug.id}>
                    {drug.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <CalcIcon className="w-5 h-5 mr-2" />
              Calculate Dose
            </button>
          </form>
        </div>

        {result && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 bg-emerald-50 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-emerald-900">Calculation Result</h3>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <dl className="space-y-6">
                <div>
                  <dt className="text-sm font-medium text-slate-500">Drug</dt>
                  <dd className="mt-1 text-xl font-semibold text-slate-900">{result.drugName}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Patient Weight</dt>
                  <dd className="mt-1 text-base text-slate-900">{result.weightKg} kg</dd>
                </div>
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                  <dt className="text-sm font-medium text-indigo-800">Calculated Dose</dt>
                  <dd className="mt-1 text-2xl font-bold text-indigo-700">{result.calculatedDose}</dd>
                  <dd className="mt-1 text-sm font-medium text-indigo-600">{result.frequency}</dd>
                </div>
                <div className="flex items-start bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <Info className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">{result.notes}</p>
                </div>
              </dl>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full flex justify-center py-3 px-4 border border-slate-300 rounded-xl shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
                >
                  <Save className="w-5 h-5 mr-2 text-slate-400" />
                  {saving ? 'Saving...' : 'Save to Dashboard'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
