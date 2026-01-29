import React, { useEffect, useState } from 'react';
import { Sun, Cloud, CloudRain, CloudLightning, Snowflake, Moon, CloudSun, Wind, CloudDrizzle, CloudFog } from 'lucide-react';

interface WeatherData {
    current: {
        temp: number;
        code: number;
        isDay: boolean;
    };
    daily: {
        time: string[];
        code: number[];
        maxTemp: number[];
        minTemp: number[];
    };
}

// Weather code mapping to minimal description and icon
const getWeatherInfo = (code: number, isDay: boolean = true) => {
    // WMO Weather interpretation codes (WW)
    // 0: Clear sky
    if (code === 0) return { icon: isDay ? Sun : Moon, label: 'Clear', color: isDay ? 'text-yellow-400' : 'text-slate-200' };

    // 1, 2, 3: Mainly clear, partly cloudy, and overcast
    if (code === 1) return { icon: isDay ? CloudSun : Moon, label: 'Fair', color: isDay ? 'text-orange-300' : 'text-blue-100' };
    if (code === 2) return { icon: Cloud, label: 'Cloudy', color: 'text-sky-200' };
    if (code === 3) return { icon: Cloud, label: 'Overcast', color: 'text-sky-300' };

    // 45, 48: Fog
    if (code === 45 || code === 48) return { icon: CloudFog, label: 'Fog', color: 'text-blue-200' };

    // 51, 53, 55, 56, 57: Drizzle
    if ([51, 53, 55, 56, 57].includes(code)) return { icon: CloudDrizzle, label: 'Drizzle', color: 'text-blue-300' };

    // 61, 63, 65, 66, 67: Rain
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { icon: CloudRain, label: 'Rain', color: 'text-blue-400' };

    // 71, 73, 75, 77, 85, 86: Snow
    if ([71, 73, 75, 77, 85, 86].includes(code)) return { icon: Snowflake, label: 'Snow', color: 'text-white' };

    // 95, 96, 99: Thunderstorm
    if ([95, 96, 99].includes(code)) return { icon: CloudLightning, label: 'Storm', color: 'text-purple-400' };

    return { icon: Sun, label: 'Clear', color: 'text-yellow-400' };
};

const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
};

export const WeatherWidget: React.FC = () => {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                // Alanya Coordinates: 36.5436° N, 31.9998° E
                const res = await fetch(
                    'https://api.open-meteo.com/v1/forecast?latitude=36.5436&longitude=31.9998&current=temperature_2m,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto'
                );
                const data = await res.json();

                setWeather({
                    current: {
                        temp: Math.round(data.current.temperature_2m),
                        code: data.current.weather_code,
                        isDay: !!data.current.is_day
                    },
                    daily: {
                        time: data.daily.time,
                        code: data.daily.weather_code,
                        maxTemp: data.daily.temperature_2m_max,
                        minTemp: data.daily.temperature_2m_min
                    }
                });
            } catch (error) {
                console.error('Failed to fetch weather', error);
            } finally {
                setLoading(false);
            }
        };

        fetchWeather();
    }, []);

    if (loading || !weather) return null;

    const CurrentIcon = getWeatherInfo(weather.current.code, weather.current.isDay).icon;
    const currentInfo = getWeatherInfo(weather.current.code, weather.current.isDay);

    return (
        <div className="group absolute top-20 right-4 md:top-8 md:right-6 lg:right-12 z-40 transition-all duration-300 ease-in-out hidden sm:block">
            {/* Main Widget Card */}
            <div className="relative overflow-hidden rounded-xl bg-slate-900/20 backdrop-blur-md border border-white/20 shadow-xl text-white p-2 pr-4 hover:bg-slate-900/30 transition-all cursor-default group-hover:scale-[1.02] duration-300">

                {/* Current Weather Display */}
                <div className="flex items-center gap-3">
                    <div className={`${currentInfo.color} drop-shadow-md filter`}>
                        <CurrentIcon size={28} strokeWidth={2} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold leading-none tracking-tight drop-shadow-sm">{weather.current.temp}°</div>
                        <div className="text-xs font-medium opacity-90 mt-0.5 tracking-wide drop-shadow-sm">{currentInfo.label}</div>
                    </div>
                </div>
            </div>

            {/* Popover Forecast (Visible on Hover) */}
            <div className="absolute top-full right-0 mt-3 w-64 p-4 rounded-2xl bg-slate-950/60 backdrop-blur-xl border border-white/10 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50 text-white">
                <h4 className="text-sm font-semibold mb-3 border-b border-white/10 pb-2">Weekly Forecast</h4>
                <div className="space-y-3">
                    {weather.daily.time.slice(1, 6).map((date, i) => { // Next 5 days
                        const index = i + 1; // Skip today (index 0)
                        const code = weather.daily.code[index];
                        const max = Math.round(weather.daily.maxTemp[index]);
                        const min = Math.round(weather.daily.minTemp[index]);
                        const info = getWeatherInfo(code);
                        const DayIcon = info.icon;

                        return (
                            <div key={date} className="flex items-center justify-between text-sm">
                                <span className="w-10 font-medium opacity-80">{getDayName(date)}</span>
                                <div className={`flex flex-col items-center ${info.color}`}>
                                    <DayIcon size={18} />
                                </div>
                                <div className="flex gap-2 w-16 justify-end">
                                    <span className="font-bold">{max}°</span>
                                    <span className="opacity-60 text-xs mt-0.5">{min}°</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
