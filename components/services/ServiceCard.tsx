import React from 'react';
import { LucideIcon } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface ServiceCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    imageUrl?: string;
    price?: string;
    actionLabel?: string;
    onClick?: () => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
    title,
    description,
    icon: Icon,
    imageUrl,
    price,
    actionLabel,
    onClick
}) => {
    return (
        <div className="group bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg transition-all duration-300">
            {imageUrl && (
                <div className="relative h-48 overflow-hidden">
                    <img
                        src={imageUrl}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow-sm">
                        <Icon className="w-5 h-5 text-primary" />
                    </div>
                </div>
            )}

            <div className="p-6">
                {!imageUrl && (
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 text-primary">
                        <Icon size={24} />
                    </div>
                )}

                <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-slate-500 mb-4 line-clamp-2">{description}</p>

                <div className="flex items-center justify-between mt-auto">
                    {price && (
                        <div>
                            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Starts from</span>
                            <span className="text-lg font-bold text-primary">{price}</span>
                        </div>
                    )}

                    <button
                        onClick={onClick}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${price
                                ? 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                                : 'w-full bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20'
                            }`}
                    >
                        {actionLabel || 'View Details'}
                    </button>
                </div>
            </div>
        </div>
    );
};
