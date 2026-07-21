import React, { useEffect, useState, useRef } from 'react';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';

interface BookingStatusChartProps {
    data: any[];
}

export const BookingStatusChart: React.FC<BookingStatusChartProps> = ({ data }) => {
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
        <div className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50 h-[350px] flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Booking Status</h3>
            <div ref={chartRef} className="flex-1 w-full min-h-[200px] min-w-0 overflow-hidden">
                {chartDims.width > 0 && chartDims.height > 0 && (
                    <PieChart width={chartDims.width} height={chartDims.height}>
                        <Pie
                            data={data}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    </PieChart>
                )}
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-4">
                {data.map((entry: any) => (
                    <div key={entry.name} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-xs text-slate-500 font-medium">{entry.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
