import React from 'react';
import { Search, MapPin, Calendar, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { LOCATIONS } from '../../data/constants';
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
    const [showSuggestions, setShowSuggestions] = React.useState(false);
    const locationWrapperRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (locationWrapperRef.current && !locationWrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

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
            <div className="flex-1 relative group" ref={locationWrapperRef}>
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                    <MapPin className="text-slate-400" size={20} />
                </div>
                <input
                    type="text"
                    className="w-full h-14 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-none focus:ring-2 focus:ring-primary outline-none text-slate-700 dark:text-slate-200 font-medium placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
                    placeholder={t('search.location')}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                />

                {showSuggestions && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 max-h-60 overflow-y-auto z-50 animate-scale-in origin-top">
                        {LOCATIONS.filter(loc => loc.toLowerCase().includes(location.toLowerCase())).map(loc => (
                            <button
                                key={loc}
                                className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-2"
                                onClick={() => {
                                    setLocation(loc);
                                    setShowSuggestions(false);
                                }}
                            >
                                <MapPin size={14} className="text-slate-400" />
                                {loc}
                            </button>
                        ))}
                        {location && LOCATIONS.filter(loc => loc.toLowerCase().includes(location.toLowerCase())).length === 0 && (
                            <div className="px-4 py-3 text-slate-400 text-sm flex items-center gap-2">
                                <MapPin size={14} />
                                <span>Custom location: "{location}"</span>
                            </div>
                        )}
                    </div>
                )}
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
                className="bg-primary hover:bg-primary-dark text-white h-14 px-8 rounded-xl font-semibold flex items-center justify-center gap-2 hover-lift shadow-lg shadow-primary/30"
            >
                <Search size={20} />
                {t('search.button')}
            </button>
        </div>
    );
};
