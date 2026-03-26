import React, { useEffect, useState, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface RevenueChartProps {
    data: any[];
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
    const [chartDims, setChartDims] = useState({ width: 0, height: 0 });
    const chartRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleResize = (entries: ResizeObserverEntry[]) => {
            for (const entry of entries) {
                if (entry.target === chartRef.current) {
                    setChartDims({
                        width: entry.contentRect.width,
                        height: entry.contentRect.height
                    });
                }
            }
        };

        const observer = new ResizeObserver(handleResize);
        if (chartRef.current) observer.observe(chartRef.current);

        return () => observer.disconnect();
    }, []);

    return (
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50 h-[350px]">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Revenue Trend</h3>
            <div ref={chartRef} className="h-[280px] w-full min-w-0 overflow-hidden">
                {chartDims.width > 0 && chartDims.height > 0 && (
                    <AreaChart
                        width={chartDims.width}
                        height={chartDims.height}
                        data={data}
                    >
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0D9488" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#0D9488" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} tickFormatter={(value) => `€${value}`} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ color: '#0F172A', fontWeight: 'bold' }}
                            formatter={(value: number) => [`€${value.toLocaleString()}`, 'Revenue']}
                        />
                        <Area type="monotone" dataKey="value" stroke="#0D9488" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                )}
            </div>
        </div>
    );
};
