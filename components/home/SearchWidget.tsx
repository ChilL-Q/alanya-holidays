import React from 'react';
import { Search, Calendar, MapPin, User } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { LOCATIONS } from '../../constants';

interface SearchWidgetProps {
    location: string;
    setLocation: (loc: string) => void;
}

export const SearchWidget: React.FC<SearchWidgetProps> = ({ location, setLocation }) => {
    const { t } = useLanguage();

    return (
        <div className="bg-white rounded-2xl shadow-2xl p-2 md:p-3 flex flex-col md:flex-row gap-2">
            <div className="flex-1 relative group">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <MapPin className="text-slate-400" size={20} />
                </div>
                <select
                    className="w-full h-14 pl-10 pr-4 rounded-xl bg-slate-50 hover:bg-slate-100 border-none focus:ring-2 focus:ring-primary outline-none appearance-none text-slate-700 font-medium cursor-pointer"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                >
                    <option value="">{t('search.location')}</option>
                    {LOCATIONS.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                    ))}
                </select>
            </div>

            <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Calendar className="text-slate-400" size={20} />
                </div>
                <input
                    type="text"
                    placeholder={t('search.dates')}
                    onFocus={(e) => e.target.type = 'date'}
                    onBlur={(e) => e.target.type = 'text'}
                    className="w-full h-14 pl-10 pr-4 rounded-xl bg-slate-50 hover:bg-slate-100 border-none focus:ring-2 focus:ring-primary outline-none text-slate-700 font-medium"
                />
            </div>

            <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <User className="text-slate-400" size={20} />
                </div>
                <input
                    type="number"
                    placeholder={t('search.guests')}
                    min={1}
                    className="w-full h-14 pl-10 pr-4 rounded-xl bg-slate-50 hover:bg-slate-100 border-none focus:ring-2 focus:ring-primary outline-none text-slate-700 font-medium"
                />
            </div>

            <button className="bg-primary hover:bg-primary-dark text-white h-14 px-8 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/30">
                <Search size={20} />
                {t('search.button')}
            </button>
        </div>
    );
};
