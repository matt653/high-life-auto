import React from 'react';
import { Sale } from '../types';
import { DollarSign, Car, Users, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  sales: Sale[];
}

const Dashboard: React.FC<DashboardProps> = ({ sales }) => {
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.vehicle.price, 0);
  const totalVehicles = sales.length;
  const avgPrice = totalVehicles > 0 ? totalRevenue / totalVehicles : 0;

  // Calculate sales by type for chart
  const salesByType = sales.reduce((acc, sale) => {
    const type = sale.vehicle.type;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(salesByType).map(([name, value]) => ({ name, value }));
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dashboard Overview</h2>
          <p className="text-slate-500">Welcome back. Here's what's happening at the dealership.</p>
        </div>
        <div className="text-sm text-slate-400">
            Last Updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Revenue" 
          value={`$${totalRevenue.toLocaleString()}`} 
          icon={DollarSign} 
          trend="+12% vs last month"
          color="bg-blue-500"
        />
        <StatCard 
          title="Vehicles Sold" 
          value={totalVehicles.toString()} 
          icon={Car} 
          trend="+5 units this week"
          color="bg-emerald-500"
        />
        <StatCard 
          title="Avg. Sale Price" 
          value={`$${Math.round(avgPrice).toLocaleString()}`} 
          icon={TrendingUp} 
          trend="Stable"
          color="bg-amber-500"
        />
        <StatCard 
          title="Active Customers" 
          value={sales.length.toString()} 
          icon={Users} 
          trend="100% Retention"
          color="bg-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Sales Volume by Vehicle Type</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {sales.slice(0, 4).map((sale) => (
              <div key={sale.id} className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                  <Car size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {sale.customer.lastName} bought a {sale.vehicle.model}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(sale.saleDate).toLocaleDateString()} • {sale.vehicle.type}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between">
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
      <p className="text-xs text-emerald-600 font-medium mt-2">{trend}</p>
    </div>
    <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
      <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
    </div>
  </div>
);

export default Dashboard;