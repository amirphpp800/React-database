import React, { useRef } from 'react';
import { IpData } from '../types';
import { ExportIcon } from './icons/ExportIcon';
import { ImportIcon } from './icons/ImportIcon';
import { InstallIcon } from './icons/InstallIcon';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: () => void;
    onImport: (data: IpData) => void;
    onInstall: () => void;
    canInstall: boolean;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onExport, onImport, onInstall, canInstall }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result;
            if (typeof text === 'string') {
                try {
                    const importedData = JSON.parse(text);
                    onImport(importedData);
                } catch (error) {
                    console.error("Failed to parse JSON", error);
                    alert('خطا در بازیابی اطلاعات. لطفاً از معتبر بودن فایل پشتیبان اطمینان حاصل کنید.');
                }
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div 
                className="bg-gray-900/70 border border-white/20 rounded-2xl shadow-2xl p-6 w-full max-w-md backdrop-blur-xl animate-fade-in"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">تنظیمات پایگاه داده</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
                </div>
                <div className="space-y-4">
                     <button
                        onClick={onExport}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-green-500/20 text-green-300 border border-green-500/30 rounded-lg font-semibold hover:bg-green-500/40 transition-colors"
                    >
                        <ExportIcon className="w-6 h-6" />
                        <span>تهیه نسخه پشتیبان (JSON)</span>
                    </button>
                    <button
                        onClick={handleImportClick}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-lg font-semibold hover:bg-sky-500/40 transition-colors"
                    >
                        <ImportIcon className="w-6 h-6" />
                        <span>بازیابی اطلاعات از فایل</span>
                    </button>
                    {canInstall && (
                         <button
                            onClick={onInstall}
                            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg font-semibold hover:bg-indigo-500/40 transition-colors"
                        >
                            <InstallIcon className="w-6 h-6" />
                            <span>نصب وب اپلیکیشن</span>
                        </button>
                    )}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".json"
                        className="hidden"
                    />
                </div>
                <p className="text-xs text-gray-500 mt-6 text-center">
                    می‌توانید از اطلاعات خود یک فایل پشتیبان تهیه کنید یا اطلاعات قبلی را از یک فایل بازیابی نمایید.
                </p>
            </div>
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in {
                    animation: fade-in 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default SettingsModal;