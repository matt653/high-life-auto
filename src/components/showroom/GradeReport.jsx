
import React from 'react';

const CategoryRow = ({ category, icon }) => {
    const getGradeColor = (g) => {
        if (g.startsWith('A')) return 'text-green-600 bg-green-50 border-green-200';
        if (g.startsWith('B')) return 'text-blue-600 bg-blue-50 border-blue-200';
        if (g.startsWith('C')) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    return (
        <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all bg-white">
            <div className="flex items-center gap-4 sm:w-1/3">
                <div className="p-3 bg-gray-100 rounded-lg text-gray-600">
                    {icon}
                </div>
                <div>
                    <h4 className="font-bold text-gray-800">{category.name}</h4>
                    <div className={`inline-flex items-center justify-center px-3 py-1 rounded-md text-sm font-black border mt-1 ${getGradeColor(category.grade)}`}>
                        Grade: {category.grade} <span className="text-xs opacity-50 ml-1">({category.score}/100)</span>
                    </div>
                </div>
            </div>
            <div className="sm:w-2/3 flex items-center">
                <p className="text-sm text-gray-600 leading-relaxed border-l-2 border-gray-100 pl-4">
                    {category.reasoning}
                </p>
            </div>
        </div>
    );
};

const GradeReport = ({ vehicle, grade, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-gray-50 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">

                {/* Header */}
                <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center z-10 shadow-sm">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Official Vehicle Report Card</h2>
                        <p className="text-sm text-gray-500 font-mono">VIN: {vehicle.vin} • {vehicle.mileage} miles</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <div className="p-6 space-y-8">

                    {/* Main Score Block */}
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="md:w-1/3 bg-gradient-to-br from-blue-900 to-indigo-900 rounded-2xl p-6 text-white flex flex-col justify-between shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 opacity-10">
                                <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm0 3.516L20.297 19H3.703L12 5.516z" /></svg>
                            </div>
                            <div>
                                <h3 className="text-blue-200 text-sm font-bold uppercase tracking-wider mb-1">Overall Grade</h3>
                                <div className="text-7xl font-black tracking-tighter">{grade.overallGrade}</div>
                                <div className="text-2xl font-medium text-blue-200 opacity-90">{grade.overallScore}/100</div>
                            </div>
                            <div className="mt-6 pt-6 border-t border-white/10">
                                <p className="text-sm text-blue-100 leading-snug italic">"{grade.summary}"</p>
                            </div>
                        </div>

                        <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {vehicle.youtubeUrl && (
                                <div className="col-span-full bg-red-50 border border-red-100 rounded-xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-red-600 text-white p-2 rounded-full">
                                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" /></svg>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">Video Evidence Available</h4>
                                            <p className="text-xs text-gray-600">AI analysis included context from video listing</p>
                                        </div>
                                    </div>
                                    <a href={vehicle.youtubeUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-red-600 hover:underline">Watch Now &rarr;</a>
                                </div>
                            )}
                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                <div className="text-xs text-gray-500 uppercase font-bold">Market Value</div>
                                <div className="text-xl font-bold text-gray-900">${vehicle.retail}</div>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                <div className="text-xs text-gray-500 uppercase font-bold">Cost to Drive</div>
                                <div className="text-xl font-bold text-gray-900">Budget Friendly</div>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Categories */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
                            Detailed Analysis
                        </h3>

                        <CategoryRow
                            category={grade.categories.body}
                            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path></svg>}
                        />

                        <CategoryRow
                            category={grade.categories.engine}
                            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>}
                        />

                        <CategoryRow
                            category={grade.categories.history}
                            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>}
                        />

                        <CategoryRow
                            category={grade.categories.mechanical}
                            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>}
                        />

                        <CategoryRow
                            category={grade.categories.demand}
                            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>}
                        />
                    </div>
                </div>

                {/* Sources Section */}
                {vehicle.groundingSources && vehicle.groundingSources.length > 0 && (
                    <div className="bg-gray-100 p-4 border-t border-gray-200">
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Sources</h4>
                        <ul className="space-y-1">
                            {vehicle.groundingSources.map((source, i) => (
                                <li key={i}>
                                    <a href={source.uri} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                                        {source.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="bg-gray-100 p-4 text-center text-xs text-gray-400 border-t border-gray-200">
                    Generated by HighLife Auto Grader AI • Engine Longevity & Market Demand verified via Google Search
                </div>
            </div>
        </div>
    );
};

export default GradeReport;
