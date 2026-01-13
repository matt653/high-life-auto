import React, { useState } from 'react';
import { VehicleType, Sale } from '../types';
import { Save, X } from 'lucide-react';

interface SalesFormProps {
  onSave: (sale: Sale) => void;
  onCancel: () => void;
}

const SalesForm: React.FC<SalesFormProps> = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    type: VehicleType.SUV,
    price: 0,
    vin: '',
    saleDate: new Date().toISOString().split('T')[0],
    notes: '',
    profit: 0,
    daysOnLot: 0
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newSale: Sale = {
      id: Math.random().toString(36).substr(2, 9),
      customer: {
        id: Math.random().toString(36).substr(2, 9),
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        birthDate: formData.birthDate,
      },
      vehicle: {
        make: formData.make,
        model: formData.model,
        year: Number(formData.year),
        type: formData.type as VehicleType,
        price: Number(formData.price),
        vin: formData.vin
      },
      saleDate: formData.saleDate,
      profit: Number(formData.profit),
      daysOnLot: Number(formData.daysOnLot),
      notes: formData.notes
    };
    onSave(newSale);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
      <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Record New Sale</h2>
        <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Customer Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Customer Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
              <input required name="firstName" onChange={handleChange} className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="John" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
              <input required name="lastName" onChange={handleChange} className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Doe" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input required type="email" name="email" onChange={handleChange} className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="john@example.com" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input required name="phone" onChange={handleChange} className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="(555) 123-4567" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Birthday</label>
              <input required type="date" name="birthDate" onChange={handleChange} className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
        </div>

        {/* Vehicle Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Vehicle Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Make</label>
              <input required name="make" onChange={handleChange} className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ford" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Model</label>
              <input required name="model" onChange={handleChange} className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Explorer" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
              <input required type="number" name="year" onChange={handleChange} value={formData.year} className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select name="type" onChange={handleChange} className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                {Object.values(VehicleType).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Price ($)</label>
              <input required type="number" name="price" onChange={handleChange} className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="45000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">VIN</label>
              <input required name="vin" onChange={handleChange} className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="17 Digit VIN" />
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Deal Context</h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sale Date</label>
                <input required type="date" name="saleDate" onChange={handleChange} value={formData.saleDate} className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Profit ($)</label>
                <input required type="number" name="profit" onChange={handleChange} value={formData.profit} className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="2500" />
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Days on Lot</label>
                <input required type="number" name="daysOnLot" onChange={handleChange} value={formData.daysOnLot} className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="15" />
             </div>
             <div className="md:col-span-3">
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes / Preferences</label>
                <textarea name="notes" onChange={handleChange} rows={3} className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Customer mentioned loving off-road trips. Buying for spouse..." />
             </div>
           </div>
        </div>

        <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t">
          <button type="button" onClick={onCancel} className="px-6 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button type="submit" className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/30">
            <Save size={18} />
            Save Record
          </button>
        </div>
      </form>
    </div>
  );
};

export default SalesForm;