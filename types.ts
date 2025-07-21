export enum IpStatus {
  Available = 'can buy',
  Sold = 'sold',
}

export interface IpInfo {
  address: string;
  status: IpStatus;
}

export interface IpData {
  [countryIso: string]: IpInfo[];
}

export interface CountryInfo {
    name: string;
    name_en: string;
    iso: string;
    emoji: string;
}
