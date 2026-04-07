import React, { Suspense } from 'react';
import { Star } from 'lucide-react';

// Lazy load react-datepicker to reduce initial bundle
const LazyDatePicker = React.lazy(() =>
  import('react-datepicker').then(module => {
    import('react-datepicker/dist/react-datepicker.css');
    return { default: module.default };
  })
);

import { useLanguage } from '../../../context/LanguageContext';

interface PropertyBookingCardProps {
    pricePerNight: number;
    reviewsCount: number;
    rating: number;
    checkIn: Date | null;
    checkOut: Date | null;
    setCheckIn: (date: Date | null) => void;
    setCheckOut: (date: Date | null) => void;
    blockedDates: Date[];
    guestsCount: number;
    maxGuests: number;
    onBook: () => void;
    nights: number;
    cleaningFee: number;
    displayPrice: (amount: number) => string;
}

const DateInput = React.forwardRef<HTMLInputElement, any>((props, ref) => (
    <input
        {...props}
        ref={ref}
        className={props.className}
        placeholder={props.placeholder}
    />
));

// Wrapper for lazy-loaded DatePicker
const DatePickerWrapper: React.FC<any> = ({ selected, onChange, selects, ...rest }) => (
    <Suspense fallback={
        <div className="w-full h-10 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
    }>
        <LazyDatePicker
            selected={selected}
            onChange={onChange}
            selects={selects}
            customInput={<DateInput className="w-full text-sm font-medium bg-transparent outline-none dark:text-slate-200 placeholder-slate-400" />}
            {...rest}
        />
    </Suspense>
);

export const PropertyBookingCard: React.FC<PropertyBookingCardProps> = ({
    pricePerNight,
    reviewsCount,
    rating: _rating,
    checkIn,
    checkOut,
    setCheckIn,
    setCheckOut,
    blockedDates,
    guestsCount: _guestsCount,
    maxGuests,
    onBook,
    nights,
    cleaningFee,
    displayPrice
}) => {
    const { t } = useLanguage();
    const totalPrice = pricePerNight * nights;

    return (
        <div className="relative z-30">
            <div
                className="lg:sticky lg:top-24 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800/50 p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <span className="text-2xl font-bold text-teal-600 dark:text-cyan-400">{displayPrice(pricePerNight)}</span>
                        <span className="text-slate-500 dark:text-slate-400 text-sm"> {t('featured.night')}</span>
                    </div>
                    <div
                        className="flex items-center gap-1 text-xs font-semibold text-slate-900 dark:text-white underline cursor-pointer"
                        onClick={() => {
                            document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                    >
                        {reviewsCount > 0 ? (
                            <span className="flex items-center gap-1"><Star size={12} className="fill-slate-900 dark:fill-white" /> {reviewsCount} {t('prop.reviews')}</span>
                        ) : (
                            <span className="bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded text-slate-500">New Listing</span>
                        )}
                    </div>
                </div>

                <div className="border border-slate-200 dark:border-slate-800/50 rounded-xl mb-4 overflow-hidden">
                    <div className="grid grid-cols-2 border-b border-slate-200 dark:border-slate-800/50">
                        <div className="p-3 border-r border-slate-200 dark:border-slate-800/50">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t('prop.checkin')}</label>
                            <DatePickerWrapper
                                selected={checkIn}
                                onChange={setCheckIn}
                                selectsStart
                                startDate={checkIn}
                                endDate={checkOut}
                                minDate={new Date()}
                                excludeDates={blockedDates}
                                placeholderText={t('date_format')}
                                dateFormat="dd.MM.yyyy"
                                customInput={<DateInput className="w-full h-12 text-base font-medium bg-transparent outline-none dark:text-slate-200 placeholder-slate-400" />}
                            />
                        </div>
                        <div className="p-3">
                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">{t('prop.checkout')}</label>
                            <DatePickerWrapper
                                selected={checkOut}
                                onChange={setCheckOut}
                                selectsEnd
                                startDate={checkIn}
                                endDate={checkOut}
                                minDate={checkIn || new Date()}
                                excludeDates={blockedDates}
                                placeholderText={t('date_format')}
                                dateFormat="dd.MM.yyyy"
                                customInput={<DateInput className="w-full h-12 text-base font-medium bg-transparent outline-none dark:text-slate-200 placeholder-slate-400" />}
                            />
                        </div>
                    </div>
                    <div className="p-3">
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">{t('prop.guests_label')}</label>
                        <select id="guests-select" className="w-full text-sm font-medium bg-transparent outline-none dark:text-slate-200 dark:bg-slate-900">
                            {Array.from({ length: Number(maxGuests || 1) }, (_, i) => i + 1).map((num) => (
                                <option key={num} value={num}>{num}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <button onClick={onBook} className="w-full bg-teal-700 dark:bg-cyan-600 hover:bg-teal-800 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-teal-700/20">{t('prop.reserve')}</button>
                <p className="text-center text-xs text-slate-400 mt-3">{t('prop.no_charge')}</p>

                <div className="mt-6 space-y-3">
                    <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                        <span>{displayPrice(pricePerNight)} x {nights} nights</span>
                        <span>{displayPrice(totalPrice)}</span>
                    </div>
                    {cleaningFee > 0 && (
                        <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                            <span>{t('prop.cleaning_fee')}</span>
                            <span>{displayPrice(cleaningFee)}</span>
                        </div>
                    )}
                    <div className="flex justify-between font-bold text-slate-900 dark:text-white mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/50">
                        <span>{t('prop.total')}</span>
                        <span>{displayPrice(totalPrice + cleaningFee)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
