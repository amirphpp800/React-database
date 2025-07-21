import React, { useState, useEffect, useCallback } from 'react';
import { IpData, IpInfo, IpStatus, CountryInfo } from './types';
import { loadData, saveData } from './services/storageService';
import { parseIpInput } from './utils/ipParser';
import IpInputForm from './components/IpInputForm';
import CountryCard from './components/CountryCard';
import SettingsModal from './components/SettingsModal';
import { SettingsIcon } from './components/icons/SettingsIcon';

// This is to satisfy TypeScript for the experimental 'beforeinstallprompt' event
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string
  }>;
  prompt(): Promise<void>;
}

const availableCountries: CountryInfo[] = [
  { name: 'روسیه', iso: 'RU', emoji: '🇷🇺' },
  { name: 'آمریکا', iso: 'US', emoji: '🇺🇸' },
  { name: 'ارمنستان', iso: 'AM', emoji: '🇦🇲' },
  { name: 'عمان', iso: 'OM', emoji: '🇴🇲' },
  { name: 'آلمان', iso: 'DE', emoji: '🇩🇪' },
  { name: 'چین', iso: 'CN', emoji: '🇨🇳' },
  { name: 'فرانسه', iso: 'FR', emoji: '🇫🇷' },
  { name: 'آلبانی', iso: 'AL', emoji: '🇦🇱' },
  { name: 'بلژیک', iso: 'BE', emoji: '🇧🇪' },
  { name: 'چک', iso: 'CZ', emoji: '🇨🇿' },
];

const countryInfoMap = new Map(availableCountries.map(c => [c.iso, c]));

const App: React.FC = () => {
  const [ipData, setIpData] = useState<IpData>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const data = loadData();
    setIpData(data);

    const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setInstallPromptEvent(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const updateAndSaveData = (newData: IpData) => {
    const countryNameMap = Object.fromEntries(availableCountries.map(c => [c.iso, c.name]));
    const sortedCountryKeys = Object.keys(newData).sort((a, b) => countryNameMap[a]?.localeCompare(countryNameMap[b], 'fa') ?? 0);
    
    const sortedData: IpData = {};
    for (const key of sortedCountryKeys) {
      if (newData[key]) {
        const sortedIps = [...newData[key]].sort((a, b) => a.address.localeCompare(b.address));
        sortedData[key] = sortedIps;
      }
    }
    setIpData(sortedData);
    saveData(sortedData);
  }

  const handleAddIps = useCallback(async (rawInput: string, countryIso: string) => {
    const ips = parseIpInput(rawInput);
    if (ips.length === 0 || !countryIso) return;

    setIsLoading(true);
    
    setIpData(prevIpData => {
      const newData = JSON.parse(JSON.stringify(prevIpData));
      if (!newData[countryIso]) {
        newData[countryIso] = [];
      }
      
      const existingIps = new Set(newData[countryIso].map((info: IpInfo) => info.address));
      
      ips.forEach(ip => {
        if (!existingIps.has(ip)) {
          const newIpInfo: IpInfo = { address: ip, status: IpStatus.Available };
          newData[countryIso].push(newIpInfo);
          existingIps.add(ip);
        }
      });
      
      updateAndSaveData(newData);
      return newData;
    });

    setIsLoading(false);
  }, []);

  const handleDeleteIp = useCallback((countryIso: string, ipToDelete: string) => {
    if (!window.confirm(`آیا از حذف آدرس ${ipToDelete} اطمینان دارید؟`)) return;

    setIpData(prevIpData => {
      const newData = { ...prevIpData };
      newData[countryIso] = newData[countryIso].filter(ipInfo => ipInfo.address !== ipToDelete);
      if (newData[countryIso].length === 0) {
        delete newData[countryIso];
      }
      updateAndSaveData(newData);
      return newData;
    });
  }, []);

  const handleToggleIpStatus = useCallback((countryIso: string, ipToToggle: string) => {
    setIpData(prevIpData => {
      const newData = { ...prevIpData };
      const ipIndex = newData[countryIso]?.findIndex(ipInfo => ipInfo.address === ipToToggle);
      if (ipIndex > -1) {
          const currentStatus = newData[countryIso][ipIndex].status;
          newData[countryIso][ipIndex].status = currentStatus === IpStatus.Available ? IpStatus.Sold : IpStatus.Available;
      }
      updateAndSaveData(newData);
      return newData;
    });
  }, []);

  const handleDeleteSoldIps = useCallback((countryIso: string) => {
    const countryName = countryInfoMap.get(countryIso)?.name || 'این کشور';
    if (!window.confirm(`آیا از حذف تمام آدرس‌های فروخته شده در ${countryName} اطمینان دارید؟`)) return;

    setIpData(prevIpData => {
      const newData = { ...prevIpData };
      newData[countryIso] = newData[countryIso].filter(ipInfo => ipInfo.status !== IpStatus.Sold);
      if (newData[countryIso].length === 0) {
          delete newData[countryIso];
      }
      updateAndSaveData(newData);
      return newData;
    });
  }, []);

  const handleExportData = () => {
    if (Object.keys(ipData).length === 0) {
        alert('داده‌ای برای تهیه نسخه پشتیبان وجود ندارد.');
        return;
    }
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(ipData, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.download = `dns_backup_${timestamp}.json`;
    link.click();
    setIsSettingsOpen(false);
  };

  const handleImportData = (importedData: IpData) => {
     if (typeof importedData === 'object' && !Array.isArray(importedData) && importedData !== null) {
        updateAndSaveData(importedData);
        alert('داده‌ها با موفقیت بازیابی شد!');
        setIsSettingsOpen(false);
    } else {
        throw new Error('فرمت فایل نامعتبر است.');
    }
  }

  const handleInstallClick = () => {
    if (!installPromptEvent) return;
    
    installPromptEvent.prompt();
    installPromptEvent.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }
        setInstallPromptEvent(null);
        setIsSettingsOpen(false);
    });
  };


  return (
    <div className="min-h-screen bg-black text-gray-200 font-sans p-4 sm:p-6 lg:p-8">
      <div 
        className="absolute top-0 left-0 w-full h-full bg-cover bg-center opacity-10"
        style={{backgroundImage: 'url(https://www.transparenttextures.com/patterns/cubes.png)'}}
      ></div>
      <main className="max-w-7xl mx-auto relative z-10">
        <header className="text-center mb-8 md:mb-12">
           <div className="flex justify-center items-center gap-4 mb-2">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white">
              پایگاه داده DNS
            </h1>
            <button
                onClick={() => setIsSettingsOpen(true)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="باز کردن تنظیمات"
            >
                <SettingsIcon className="w-8 h-8"/>
            </button>
          </div>
          <p className="text-gray-400 text-lg mb-6">
            کشور را انتخاب کرده و آدرس‌های IP یا CIDR را برای مدیریت اضافه کنید.
          </p>
        </header>

        <SettingsModal 
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            onExport={handleExportData}
            onImport={handleImportData}
            onInstall={handleInstallClick}
            canInstall={!!installPromptEvent}
        />

        <IpInputForm onAdd={handleAddIps} isLoading={isLoading} countries={availableCountries} />

        <div className="mt-8 md:mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.keys(ipData).length > 0 ? (
            Object.entries(ipData).map(([iso, ips]) => (
              <CountryCard
                key={iso}
                country={countryInfoMap.get(iso)!}
                ips={ips}
                onDeleteIp={handleDeleteIp}
                onToggleStatus={handleToggleIpStatus}
                onDeleteSold={handleDeleteSoldIps}
              />
            ))
          ) : (
            !isLoading && (
              <div className="md:col-span-2 lg:col-span-3 text-center py-16 px-6 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                <h3 className="text-2xl font-semibold text-white">پایگاه داده شما خالی است</h3>
                <p className="text-gray-400 mt-2">برای شروع، یک کشور انتخاب کرده و آدرس IP اضافه کنید، یا از طریق منوی تنظیمات، از یک فایل پشتیبان اطلاعات خود را بازیابی نمایید.</p>
              </div>
            )
          )}
        </div>
        <footer className="text-center mt-12 text-gray-500">
            <p>ساخته شده با ❤️ ۲۰۲۵</p>
        </footer>
      </main>
    </div>
  );
};

export default App;