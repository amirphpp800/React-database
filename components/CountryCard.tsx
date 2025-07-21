import React, { useState } from 'react';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';
import { CopyIcon } from './icons/CopyIcon';
import { TrashIcon } from './icons/TrashIcon';
import { CheckIcon } from './icons/CheckIcon';
import { IpInfo, IpStatus, CountryInfo } from '../types';
import { getIpVersion } from '../utils/ipVersion';

interface CountryCardProps {
  country: CountryInfo;
  ips: IpInfo[];
  onDeleteIp: (countryIso: string, ip: string) => void;
  onToggleStatus: (countryIso: string, ip: string) => void;
  onDeleteSold: (countryIso: string) => void;
}

type IpVersion = 'IPv4' | 'IPv6';

const StatusTag: React.FC<{ status: IpStatus, onClick: () => void }> = ({ status, onClick }) => {
    const isAvailable = status === IpStatus.Available;
    const baseClasses = "px-3 py-1 text-xs font-semibold rounded-full cursor-pointer transition-all duration-200 backdrop-blur-sm select-none";
    const availableClasses = "bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/40";
    const soldClasses = "bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/40";

    return (
        <span onClick={onClick} className={`${baseClasses} ${isAvailable ? availableClasses : soldClasses}`}>
            {isAvailable ? 'قابل خرید' : 'فروخته شده'}
        </span>
    );
};

const TabButton: React.FC<{ title: string; count: number; isActive: boolean; onClick: () => void; }> = ({ title, count, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors duration-200 ${
            isActive
                ? 'border-blue-500 text-white'
                : 'border-transparent text-gray-400 hover:text-white'
        }`}
    >
        {title} <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-blue-500/30' : 'bg-gray-500/30'}`}>{count}</span>
    </button>
);

const IpList: React.FC<{
    list: IpInfo[];
    countryIso: string;
    onToggleStatus: (countryIso: string, ip: string) => void;
    onDeleteIp: (countryIso: string, ip: string) => void;
}> = ({ list, countryIso, onToggleStatus, onDeleteIp }) => {
    const [copiedIp, setCopiedIp] = useState<string | null>(null);

    const handleCopyIp = async (ipAddress: string) => {
        try {
            await navigator.clipboard.writeText(ipAddress);
            setCopiedIp(ipAddress);
            setTimeout(() => setCopiedIp(null), 2000);
        } catch (error) {
            console.warn('Copy failed', error);
        }
    };
    
    if (list.length === 0) {
        return <div className="text-center text-gray-400 py-8">موردی برای نمایش وجود ندارد.</div>;
    }

    return (
        <ul className="space-y-2 p-2 sm:p-4">
            {list.map(ipInfo => (
                <li key={ipInfo.address} className="flex justify-between items-center group bg-black/20 p-2 rounded-md hover:bg-black/30 transition-colors duration-200">
                    <span className="font-mono text-gray-300 text-sm break-all">{ipInfo.address}</span>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                        <StatusTag status={ipInfo.status} onClick={() => onToggleStatus(countryIso, ipInfo.address)} />
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => handleCopyIp(ipInfo.address)}
                                className="text-gray-400 hover:text-blue-400 transition-colors"
                                aria-label={`کپی ${ipInfo.address}`}
                            >
                                {copiedIp === ipInfo.address ? (
                                    <CheckIcon className="w-4 h-4 text-green-400" />
                                ) : (
                                    <CopyIcon className="w-4 h-4" />
                                )}
                            </button>
                            <button
                                onClick={() => onDeleteIp(countryIso, ipInfo.address)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                                aria-label={`حذف ${ipInfo.address}`}
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
};

const CountryCard: React.FC<CountryCardProps> = ({ country, ips, onDeleteIp, onToggleStatus, onDeleteSold }) => {
  const [activeTab, setActiveTab] = useState<IpVersion>('IPv4');
  const [isCopied, copyToClipboard] = useCopyToClipboard();

  const hasSoldIps = ips.some(ip => ip.status === IpStatus.Sold);
  
  const ipv4s = ips.filter(ip => getIpVersion(ip.address) === 'IPv4');
  const ipv6s = ips.filter(ip => getIpVersion(ip.address) === 'IPv6');

  const activeList = activeTab === 'IPv4' ? ipv4s : ipv6s;

  const handleCopy = () => {
    if (activeList.length > 0) {
        copyToClipboard(activeList.map(ip => ip.address).join('\n'));
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 shadow-xl overflow-hidden flex flex-col transition-all duration-300 hover:border-white/20">
      <header className="p-4 bg-white/5 border-b border-white/10 flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-3">
          <img src={`https://flagcdn.com/w40/${country.iso.toLowerCase()}.png`} width="32" alt={`پرچم ${country.name}`} className="rounded-sm" />
          <h3 className="text-xl font-bold text-white tracking-wide">{country.name}</h3>
        </div>
        <button
          onClick={() => onDeleteSold(country.iso)}
          disabled={!hasSoldIps}
          className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 text-red-300 rounded-md text-sm font-medium hover:bg-red-500/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <TrashIcon className="w-4 h-4" />
          <span>حذف فروخته‌شده‌ها</span>
        </button>
      </header>
      
      <div className="border-b border-white/10 px-2 flex justify-between items-center">
        <div className="flex">
            <TabButton title="نسل ۴" count={ipv4s.length} isActive={activeTab === 'IPv4'} onClick={() => setActiveTab('IPv4')} />
            <TabButton title="نسل ۶" count={ipv6s.length} isActive={activeTab === 'IPv6'} onClick={() => setActiveTab('IPv6')} />
        </div>
        <button
            onClick={handleCopy}
            disabled={activeList.length === 0}
            className="flex items-center gap-2 mr-2 px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-md text-sm font-medium hover:bg-blue-500/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isCopied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
            <span>{isCopied ? 'کپی شد!' : 'کپی لیست'}</span>
        </button>
      </div>

      <div className="flex-grow overflow-y-auto max-h-[22rem]">
        <IpList list={activeList} countryIso={country.iso} onToggleStatus={onToggleStatus} onDeleteIp={onDeleteIp} />
      </div>
    </div>
  );
};

export default CountryCard;