
import React from 'react';

const PublicVehicleDetails = ({ vehicle, onClose }) => {
    const grade = vehicle.aiGrade;

    // Helper to determine badge color
    const getGradeColor = (g) => {
        if (!g) return 'text-gray-400';
        if (g.startsWith('A')) return 'text-green-400'; // Lightened for dark bg
        if (g.startsWith('B')) return 'text-blue-400';
        return 'text-yellow-400';
    };

    // Helper to get embed URL
    const getEmbedUrl = (url) => {
        if (!url) return null;
        let videoId = '';
        if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1]?.split('?')[0];
        } else if (url.includes('v=')) {
            videoId = url.split('v=')[1]?.split('&')[0];
        }
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    };

    const embedUrl = getEmbedUrl(vehicle.youtubeUrl);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">

                <div className="flex flex-col lg:flex-row h-full">

                    {/* Left: Media Column */}
                    <div className="lg:w-5/12 bg-black flex flex-col overflow-hidden">
                        <div className="flex-1 relative flex items-center justify-center bg-black group">
                            <img
                                src={vehicle.imageUrls[0]}
                                className="max-w-full max-h-full object-contain"
                                alt={vehicle.model}
                            />
                            <button
                                onClick={onClose}
                                className="absolute top-4 left-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full lg:hidden"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        <div className="h-24 bg-gray-900 p-2 grid grid-cols-4 gap-2 overflow-x-auto shrink-0 custom-scrollbar">
                            {vehicle.imageUrls.slice(1, 9).map((url, i) => (
                                <div key={i} className="aspect-video bg-gray-800 rounded overflow-hidden cursor-pointer opacity-70 hover:opacity-100 transition-opacity border border-transparent hover:border-gray-500">
                                    <img src={url} className="w-full h-full object-cover" alt="" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Details Column */}
                    <div className="lg:w-7/12 flex flex-col h-full bg-white relative">
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 hidden lg:block transition-colors z-20"
                        >
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>

                        <div className="p-6 lg:p-8 overflow-y-auto flex-1 custom-scrollbar">

                            {/* Header Info */}
                            <div className="mb-6 border-b border-gray-100 pb-6 pr-8">
                                <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight leading-none">{vehicle.year} {vehicle.make} {vehicle.model}</h1>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-base">
                                    <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                                        {(parseFloat(vehicle.retail.replace(/[^0-9.]/g, '')) || 0) === 0 ? 'Call for Price' : `$${vehicle.retail}`}
                                    </span>
                                    <span className="text-gray-300">|</span>
                                    <span className="text-gray-600 font-medium">{Number(vehicle.mileage).toLocaleString()} miles</span>
                                    <span className="text-gray-300">|</span>
                                    <span className="text-gray-500 font-mono text-sm">Stock #: {vehicle.stockNumber}</span>
                                    <span className="text-gray-300">|</span>
                                    <span className="text-gray-500 text-sm">{vehicle.trim}</span>
                                </div>
                            </div>

                            {/* Grade Report Card - Compact Version */}
                            {grade ? (
                                <div className="mb-8 bg-gray-900 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
                                    <div className="absolute -top-4 -right-4 p-0 opacity-5 pointer-events-none">
                                        <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm0 3.516L20.297 19H3.703L12 5.516z" /></svg>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-6 relative z-10 items-start">
                                        {/* Grade Block */}
                                        <div className="flex flex-row sm:flex-col items-center sm:items-start gap-4 sm:gap-0 shrink-0 border-b sm:border-b-0 sm:border-r border-gray-700 pb-4 sm:pb-0 sm:pr-6">
                                            <div>
                                                <div className="text-blue-400 font-bold uppercase tracking-wider text-[10px] mb-0.5">Overall Grade</div>
                                                <div className={`text-6xl font-black leading-none ${getGradeColor(grade.overallGrade)}`}>
                                                    {grade.overallGrade}
                                                </div>
                                            </div>
                                            <div className="sm:mt-2">
                                                <div className="text-gray-400 text-xs uppercase font-bold tracking-wider">Score</div>
                                                <div className="text-xl font-bold text-white">{grade.overallScore}<span className="text-gray-500 text-sm">/100</span></div>
                                            </div>
                                        </div>

                                        {/* Summary & Categories */}
                                        <div className="flex-1 min-w-0">
                                            <div className="bg-gray-800/50 rounded-lg p-3 mb-4 border-l-2 border-blue-500">
                                                <p className="text-gray-200 text-sm leading-relaxed italic">
                                                    "{grade.summary}"
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                                                {Object.values(grade.categories).map((cat, i) => (
                                                    <div key={i} className="flex justify-between items-center bg-gray-800 px-2 py-1.5 rounded border border-gray-700">
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase truncate pr-2">{cat.name}</span>
                                                        <span className={`font-bold text-sm ${getGradeColor(cat.grade)}`}>{cat.grade}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="mb-8 p-4 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200 flex items-center gap-3 text-sm">
                                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                    <span className="font-medium">AI Analysis & Condition Grade Pending...</span>
                                </div>
                            )}

                            {/* Description & Notes */}
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
                                        Vehicle Analysis & Description
                                    </h3>

                                    {vehicle.websiteNotes && (
                                        <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-900 text-sm flex gap-3 items-start">
                                            <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                            <div>
                                                <span className="font-bold block text-blue-700 text-xs uppercase mb-0.5">Manager's Note</span>
                                                {vehicle.websiteNotes}
                                            </div>
                                        </div>
                                    )}

                                    <div className="prose prose-blue prose-sm max-w-none text-gray-600 leading-relaxed">
                                        {vehicle.marketingDescription ? (
                                            <div dangerouslySetInnerHTML={{ __html: vehicle.marketingDescription }} />
                                        ) : (
                                            <p className="italic text-gray-400">
                                                {vehicle.comments || "No detailed description available."}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Video Player */}
                                {embedUrl && (
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                            <span className="w-1 h-5 bg-red-600 rounded-full"></span>
                                            Virtual Test Drive with Miriam
                                        </h3>
                                        <div className="aspect-video w-full rounded-xl overflow-hidden shadow-lg border border-gray-200 bg-black">
                                            <iframe
                                                src={embedUrl}
                                                className="w-full h-full"
                                                title="Virtual Test Drive"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            ></iframe>
                                        </div>
                                    </div>
                                )}

                                {/* Options / Key Features */}
                                {vehicle.options && (
                                    <div className="pt-4 border-t border-gray-100">
                                        <h3 className="text-gray-900 font-bold text-xs uppercase tracking-wider mb-3">Key Features</h3>
                                        <div className="flex flex-wrap gap-1.5">
                                            {vehicle.options.split(';').map((opt, i) => (
                                                <span key={i} className="px-3 py-1 bg-gray-50 border border-gray-200 text-gray-600 rounded text-xs font-medium">
                                                    {opt.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer CTA */}
                        <div className="p-4 border-t border-gray-100 bg-white z-20 flex gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
                            <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-blue-600/20 transition-all transform hover:-translate-y-0.5 text-base flex justify-center items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                Schedule Test Drive
                            </button>
                            <button className="flex-1 bg-white hover:bg-gray-50 text-gray-800 font-bold py-3 px-4 rounded-lg border border-gray-200 transition-all text-base flex justify-center items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                                Message Dealer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicVehicleDetails;
