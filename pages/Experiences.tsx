import React from 'react';
import { Compass, Map, Sun } from 'lucide-react';

export const Experiences: React.FC = () => {
    return (
        <div className="pt-24 pb-16 min-h-screen bg-slate-50 dark:bg-slate-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-serif text-slate-900 dark:text-white mb-4">Unforgettable Experiences</h1>
                    <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        Explore the best of Alanya with our curated selection of tours and activities.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Placeholder content */}
                    {[
                        { title: 'Boat Tours', icon: <Compass size={32} />, desc: 'Sail around the peninsula and discover hidden caves.' },
                        { title: 'Castle Visit', icon: <Sun size={32} />, desc: 'Guided walking tours of the historic Alanya Castle.' },
                        { title: 'Dim Cave', icon: <Map size={32} />, desc: 'Explore the mysteries of the Dim Cave and River.' },
                    ].map((item, idx) => (
                        <div key={idx} className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                            <div className="text-teal-600 dark:text-teal-400 mb-4">{item.icon}</div>
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                            <p className="text-slate-600 dark:text-slate-400">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
