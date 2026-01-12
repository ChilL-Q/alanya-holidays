import React from 'react';
import { Search, MapPin, Calendar, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { LOCATIONS } from '../../constants';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { enGB, ru, tr } from 'date-fns/locale';
import { IMaskInput } from 'react-imask';

// Custom Masked Input Component
const DateInputMask = React.forwardRef<HTMLInputElement, any>((props, ref) => (
    <IMaskInput
        {...props}
        mask="00.00.0000"
        definitions={{
            '0': /[0-9]/
        }}
        inputRef={ref}
        overwrite
    />
));

interface SearchWidgetProps {
    location: string;
    setLocation: (loc: string) => void;
}

export const SearchWidget: React.FC<SearchWidgetProps> = ({ location, setLocation }) => {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const [checkIn, setCheckIn] = React.useState<Date | null>(null);
    const [checkOut, setCheckOut] = React.useState<Date | null>(null);
    const [guests, setGuests] = React.useState('');

    const handleSearch = () => {
        const searchParams = new URLSearchParams();
        if (location) searchParams.set('location', location);
        if (checkIn) searchParams.set('checkIn', checkIn.toISOString().split('T')[0]);
        if (checkOut) searchParams.set('checkOut', checkOut.toISOString().split('T')[0]);
        if (guests) searchParams.set('guests', guests);

        navigate(`/stays?${searchParams.toString()}`);
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-2 md:p-3 flex flex-col md:flex-row gap-2 transition-colors relative z-20">
            <div className="flex-1 relative group">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                    <MapPin className="text-slate-400" size={20} />
                </div>
                <select
                    className="w-full h-14 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-none focus:ring-2 focus:ring-primary outline-none appearance-none text-slate-700 dark:text-slate-200 font-medium cursor-pointer transition-colors relative z-20"
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
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                    <Calendar className="text-slate-400" size={20} />
                </div>
                <DatePicker
                    selected={checkIn}
                    onChange={(date) => setCheckIn(date)}
                    selectsStart
                    startDate={checkIn}
                    endDate={checkOut}
                    minDate={new Date()}
                    placeholderText={t('date_format')} // Expecting "dd.mm.yyyy", "gg.aa.yyyy" etc from locale
                    dateFormat="dd.MM.yyyy"
                    locale={language === 'ru' ? ru : language === 'tr' ? tr : enGB}
                    customInput={<DateInputMask className="w-full h-14 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-none focus:ring-2 focus:ring-primary outline-none text-slate-700 dark:text-slate-200 font-medium placeholder-slate-400 dark:placeholder-slate-500 transition-colors" />}
                    calendarClassName="!font-sans"
                    wrapperClassName="w-full"
                />
            </div>

            <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                    <Calendar className="text-slate-400" size={20} />
                </div>
                <DatePicker
                    selected={checkOut}
                    onChange={(date) => setCheckOut(date)}
                    selectsEnd
                    startDate={checkIn}
                    endDate={checkOut}
                    minDate={checkIn || new Date()}
                    placeholderText={t('date_format')}
                    dateFormat="dd.MM.yyyy"
                    locale={language === 'ru' ? ru : language === 'tr' ? tr : enGB}
                    customInput={<DateInputMask className="w-full h-14 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-none focus:ring-2 focus:ring-primary outline-none text-slate-700 dark:text-slate-200 font-medium placeholder-slate-400 dark:placeholder-slate-500 transition-colors" />}
                    calendarClassName="!font-sans"
                    wrapperClassName="w-full"
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
                className="bg-primary hover:bg-primary-dark text-white h-14 px-8 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98]"
            >
                <Search size={20} />
                {t('search.button')}
            </button>
        </div>
    );
};
