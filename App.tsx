
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { IpData, IpInfo, IpStatus, CountryInfo } from './types';
import { loadData, saveData } from './services/storageService';
import { parseIpInput } from './utils/ipParser';
import IpInputForm from './components/IpInputForm';
import CountryCard from './components/CountryCard';
import SettingsModal from './components/SettingsModal';
import { SettingsIcon } from './components/icons/SettingsIcon';
import { useLanguage } from './hooks/useLanguage';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string
  }>;
  prompt(): Promise<void>;
}

const allCountries: CountryInfo[] = [
  { name: 'روسیه', name_en: 'Russia', iso: 'RU', emoji: '🇷🇺' },
  { name: 'آمریکا', name_en: 'USA', iso: 'US', emoji: '🇺🇸' },
  { name: 'ارمنستان', name_en: 'Armenia', iso: 'AM', emoji: '🇦🇲' },
  { name: 'امارات متحده عربی', name_en: 'UAE', iso: 'AE', emoji: '🇦🇪' },
  { name: 'عمان', name_en: 'Oman', iso: 'OM', emoji: '🇴🇲' },
  { name: 'آلمان', name_en: 'Germany', iso: 'DE', emoji: '🇩🇪' },
  { name: 'چین', name_en: 'China', iso: 'CN', emoji: '🇨🇳' },
  { name: 'فرانسه', name_en: 'France', iso: 'FR', emoji: '🇫🇷' },
  { name: 'آلبانی', name_en: 'Albania', iso: 'AL', emoji: '🇦🇱' },
  { name: 'بلژیک', name_en: 'Belgium', iso: 'BE', emoji: '🇧🇪' },
  { name: 'چک', name_en: 'Czech Republic', iso: 'CZ', emoji: '🇨🇿' },
];

const App: React.FC = () => {
  const [ipData, setIpData] = useState<IpData>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const { t, lang } = useLanguage();

  const countryInfoMap = useMemo(() => new Map(allCountries.map(c => [c.iso, c])), []);

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

  const updateAndSaveData = useCallback((newData: IpData) => {
    const sortedCountryKeys = Object.keys(newData).sort((a, b) => {
        const countryA = countryInfoMap.get(a);
        const countryB = countryInfoMap.get(b);
        if (!countryA || !countryB) return 0;
        
        const nameA = lang === 'fa' ? countryA.name : countryA.name_en;
        const nameB = lang === 'fa' ? countryB.name : countryB.name_en;
        
        return nameA.localeCompare(nameB, lang);
    });
    
    const sortedData: IpData = {};
    for (const key of sortedCountryKeys) {
      if (newData[key]) {
        const sortedIps = [...newData[key]].sort((a, b) => a.address.localeCompare(b.address, undefined, { numeric: true }));
        sortedData[key] = sortedIps;
      }
    }
    setIpData(sortedData);
    saveData(sortedData);
  }, [lang, countryInfoMap]);

  useEffect(() => {
    // Re-sort data when language changes to ensure country list is ordered correctly
    setIpData(currentData => {
      if (Object.keys(currentData).length === 0) {
        return currentData; // No change
      }
      const sortedCountryKeys = Object.keys(currentData).sort((a, b) => {
        const countryA = countryInfoMap.get(a);
        const countryB = countryInfoMap.get(b);
        if (!countryA || !countryB) return 0;
        
        const nameA = lang === 'fa' ? countryA.name : countryA.name_en;
        const nameB = lang === 'fa' ? countryB.name : countryB.name_en;
        
        return nameA.localeCompare(nameB, lang);
      });

      const currentKeys = Object.keys(currentData);
      // Only update state if the order has actually changed to prevent unnecessary re-renders.
      if (JSON.stringify(sortedCountryKeys) === JSON.stringify(currentKeys)) {
        return currentData;
      }

      const sortedData: IpData = {};
      for (const key of sortedCountryKeys) {
        sortedData[key] = currentData[key];
      }
      saveData(sortedData); // Persist the newly sorted data
      return sortedData;
    });
  }, [lang, countryInfoMap]);


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
  }, [updateAndSaveData]);

  const handleDeleteIp = useCallback((countryIso: string, ipToDelete: string) => {
    if (!window.confirm(t('confirmDeleteIp', { ip: ipToDelete }))) return;

    setIpData(prevIpData => {
      const newData = { ...prevIpData };
      newData[countryIso] = newData[countryIso].filter(ipInfo => ipInfo.address !== ipToDelete);
      if (newData[countryIso].length === 0) {
        delete newData[countryIso];
      }
      updateAndSaveData(newData);
      return newData;
    });
  }, [t, updateAndSaveData]);

  const handleToggleIpStatus = useCallback((countryIso: string, ipToToggle: string) => {
    setIpData(prevIpData => {
      const newData = { ...prevIpData };
      const ipIndex = newData[countryIso]?.findIndex(ipInfo => ipInfo.address === ipToToggle);
      if (ipIndex !== undefined && ipIndex > -1) {
          const currentStatus = newData[countryIso][ipIndex].status;
          newData[countryIso][ipIndex].status = currentStatus === IpStatus.Available ? IpStatus.Sold : IpStatus.Available;
      }
      updateAndSaveData(newData);
      return newData;
    });
  }, [updateAndSaveData]);

  const handleDeleteSoldIps = useCallback((countryIso: string) => {
    const country = countryInfoMap.get(countryIso);
    const countryName = country ? (lang === 'fa' ? country.name : country.name_en) : 'this country';
    if (!window.confirm(t('confirmDeleteSold', { countryName }))) return;

    setIpData(prevIpData => {
      const newData = { ...prevIpData };
      newData[countryIso] = newData[countryIso].filter(ipInfo => ipInfo.status !== IpStatus.Sold);
      if (newData[countryIso].length === 0) {
          delete newData[countryIso];
      }
      updateAndSaveData(newData);
      return newData;
    });
  }, [t, lang, countryInfoMap, updateAndSaveData]);

  const handleExportData = () => {
    if (Object.keys(ipData).length === 0) {
        alert(t('noDataToExport'));
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
        alert(t('importSuccess'));
        setIsSettingsOpen(false);
    } else {
        throw new Error(t('invalidFileFormat'));
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
    <div className="min-h-screen bg-black text-gray-200 p-4 sm:p-6 lg:p-8">
      <div 
        className="absolute top-0 left-0 w-full h-full bg-cover bg-center opacity-10"
        style={{backgroundImage: 'url(https://www.transparenttextures.com/patterns/cubes.png)'}}
      ></div>
      <main className="max-w-7xl mx-auto relative z-10">
        <header className="text-center mb-8 md:mb-12">
           <div className="flex justify-center items-center gap-4 mb-2">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white">
              {t('appTitle')}
            </h1>
            <button
                onClick={() => setIsSettingsOpen(true)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label={t('openSettings')}
            >
                <SettingsIcon className="w-8 h-8"/>
            </button>
          </div>
          <p className="text-gray-400 text-lg mb-6">
            {t('appDescription')}
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

        <IpInputForm onAdd={handleAddIps} isLoading={isLoading} countries={allCountries} />

        <div className="mt-8 md:mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.keys(ipData).length > 0 ? (
            Object.entries(ipData).map(([iso, ips]) => {
              const country = countryInfoMap.get(iso);
              return country ? (
                <CountryCard
                  key={iso}
                  country={country}
                  ips={ips}
                  onDeleteIp={handleDeleteIp}
                  onToggleStatus={handleToggleIpStatus}
                  onDeleteSold={handleDeleteSoldIps}
                />
              ) : null;
            })
          ) : (
            !isLoading && (
              <div className="md:col-span-2 lg:col-span-3 text-center py-16 px-6 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                <h3 className="text-2xl font-semibold text-white">{t('emptyStateTitle')}</h3>
                <p className="text-gray-400 mt-2">{t('emptyStateDescription')}</p>
              </div>
            )
          )}
        </div>
        <footer className="text-center mt-12 text-gray-500">
            <p>{t('footerText')}</p>
        </footer>
      </main>
    </div>
  );
};

export default App;
