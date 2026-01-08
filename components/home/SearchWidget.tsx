import React from 'react';
import { Search, MapPin, Calendar, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { LOCATIONS } from '../../constants';

interface SearchWidgetProps {
    location: string;
    setLocation: (loc: string) => void;
}

export const SearchWidget: React.FC<SearchWidgetProps> = ({ location, setLocation }) => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [checkIn, setCheckIn] = React.useState('');
    const [checkOut, setCheckOut] = React.useState('');
    const [guests, setGuests] = React.useState('');
    const [checkInType, setCheckInType] = React.useState('text');
    const [checkOutType, setCheckOutType] = React.useState('text');

    const handleSearch = () => {
        const searchParams = new URLSearchParams();
        if (location) searchParams.set('location', location);
        if (checkIn) searchParams.set('checkIn', checkIn);
        if (checkOut) searchParams.set('checkOut', checkOut);
        if (guests) searchParams.set('guests', guests);

        navigate(`/search?${searchParams.toString()}`);
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-2 md:p-3 flex flex-col md:flex-row gap-2 transition-colors">
            <div className="flex-1 relative group">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <MapPin className="text-slate-400" size={20} />
                </div>
                <select
                    className="w-full h-14 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-none focus:ring-2 focus:ring-primary outline-none appearance-none text-slate-700 dark:text-slate-200 font-medium cursor-pointer transition-colors"
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
                    type={checkInType}
                    placeholder={t('search.checkin')}
                    onFocus={() => setCheckInType('date')}
                    onBlur={() => {
                        if (!checkIn) setCheckInType('text');
                    }}
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full h-14 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-none focus:ring-2 focus:ring-primary outline-none text-slate-700 dark:text-slate-200 font-medium placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
                />
            </div>

            <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Calendar className="text-slate-400" size={20} />
                </div>
                <input
                    type={checkOutType}
                    placeholder={t('search.checkout')}
                    onFocus={() => setCheckOutType('date')}
                    onBlur={() => {
                        if (!checkOut) setCheckOutType('text');
                    }}
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full h-14 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-none focus:ring-2 focus:ring-primary outline-none text-slate-700 dark:text-slate-200 font-medium placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
                />
            </div>

            <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Users className="text-slate-400" size={20} />
                </div>
                <input
                    type="number"
                    placeholder={t('search.guests')}
                    min={1}
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    className="w-full h-14 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-none focus:ring-2 focus:ring-primary outline-none text-slate-700 dark:text-slate-200 font-medium placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
                />
            </div>

            <button
                onClick={handleSearch}
                className="bg-primary hover:bg-primary-dark text-white h-14 px-8 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/30"
            >
                <Search size={20} />
                {t('search.button')}
            </button>
        </div>
    );
};
