import React from 'react';
import { Home, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';

interface ProfilePropertiesTabProps {
    properties: any[];
    loading: boolean;
}

export const ProfilePropertiesTab: React.FC<ProfilePropertiesTabProps> = ({
    properties,
    loading
}) => {
    const { t } = useLanguage();
    const navigate = useNavigate();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">{t('profile.my_properties')}</h2>
                <button
                    onClick={() => navigate('/list-property')}
                    className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                >
                    <Home size={18} />
                    {t('profile.add_property')}
                </button>
            </div>

            {loading ? (
                <div className="grid gap-4">
                    {[1, 2].map(i => (
                        <div key={i} className="bg-white dark:bg-slate-800/80 rounded-2xl h-40 animate-pulse border border-slate-100 dark:border-slate-800/50"></div>
                    ))}
                </div>
            ) : properties.length === 0 ? (
                <div className="bg-white dark:bg-slate-800/80 rounded-3xl shadow-sm p-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800/50">
                    <Home size={48} className="mx-auto text-slate-200 dark:text-slate-300 mb-6" />
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('profile.no_properties')}</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto">{t('profile.add_property')}</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {properties.map((property) => (
                        <div key={property.id} className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm overflow-hidden border border-slate-100 dark:border-slate-800/50 group hover:shadow-xl transition-all duration-300">
                            <div className="flex flex-col md:flex-row">
                                <div className="w-full md:w-64 h-48 md:h-auto overflow-hidden relative">
                                    {property.images?.[0] ? (
                                        <img src={property.images[0]} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" alt={property.title} />
                                    ) : (
                                        <div className="flex items-center justify-center h-full bg-slate-50 dark:bg-slate-900 text-slate-400">
                                            <Home size={32} />
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${property.status === 'approved' ? 'bg-green-500 text-white' :
                                            property.status === 'rejected' ? 'bg-red-500 text-white' :
                                                'bg-amber-500 text-white'
                                            }`}>
                                            {property.status || 'Pending'}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-6 flex-grow flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="text-[10px] font-bold text-accent dark:text-amber-400 uppercase tracking-widest mb-1">
                                                    {property.type}
                                                </p>
                                                <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                                                    {property.title}
                                                </h3>
                                                <div className="flex items-center gap-1 text-slate-500 text-sm mt-1">
                                                    <MapPin size={14} />
                                                    {property.location}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-serif font-bold text-slate-900 dark:text-white">
                                                    €{property.price_per_night}
                                                    <span className="text-xs font-sans font-normal text-slate-400">/night</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex items-center justify-end border-t border-slate-50 dark:border-slate-800/50 pt-4">
                                        <button
                                            onClick={() => navigate(`/properties/${property.id}`)}
                                            className="text-white bg-slate-900 dark:bg-slate-800/50 px-4 py-2 rounded-lg text-sm font-medium hover:bg-black dark:hover:bg-slate-600 transition-colors"
                                        >
                                            {t('profile.view_page') || 'View Page'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
