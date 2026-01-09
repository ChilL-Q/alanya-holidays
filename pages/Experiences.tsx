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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[
                        { title: 'Boat Tours', icon: <Compass size={32} />, desc: 'Sail around the peninsula, discover phosphorus caves, and swim in turquoise waters.' },
                        { title: 'Castle Visit', icon: <Sun size={32} />, desc: 'Guided panoramic walking tours of the historic Seljuk-era Alanya Castle.' },
                        { title: 'Dim Cave & River', icon: <Map size={32} />, desc: 'Explore the mysteries of the Dim Cave and have a refreshing lunch on the river.' },
                        { title: 'Paragliding', icon: <Compass size={32} />, desc: 'Fly from the Taurus mountains and land on Kleopatra beach. Unforgettable views.' },
                        { title: 'Turkish Bath (Hamam)', icon: <Sun size={32} />, desc: 'Relax and rejuvenate with a traditional peeling and foam massage experience.' },
                        { title: 'Jeep Safari', icon: <Map size={32} />, desc: 'Off-road adventure through the Taurus mountains, visiting authentic villages.' },
                    ].map((item, idx) => (
                        <div
                            key={idx}
                            className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 dark:border-slate-700 animate-stagger-enter"
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            <div className="text-accent mb-6 bg-orange-50 dark:bg-orange-900/20 w-16 h-16 rounded-xl flex items-center justify-center">{item.icon}</div>
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">{item.title}</h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">{item.desc}</p>
                            <button className="text-accent font-medium hover:text-accent-hover transition-colors flex items-center gap-2">
                                Book Experience →
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
