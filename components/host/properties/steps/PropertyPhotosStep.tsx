import React from 'react';
import { PhotoUploader } from '../../../ui/PhotoUploader';
import { useLanguage } from '../../../../context/LanguageContext';

interface PropertyPhotosStepProps {
    files: File[];
    setFiles: (files: File[]) => void;
}

export const PropertyPhotosStep: React.FC<PropertyPhotosStepProps> = ({ files, setFiles }) => {
    const { t } = useLanguage();

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('list_prop.step5_title')}</h2>
            <p className="text-slate-500 dark:text-slate-400">{t('list_prop.photos_desc')}</p>
            <PhotoUploader files={files} onChange={setFiles} />
        </div>
    );
};
