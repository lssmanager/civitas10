import { useMemo } from 'react';
import { useApi } from './base';

export type CountryOption = { id: number; name: string; iso2: string; phoneCode: string | null; emoji: string | null };
export type StateOption = { id: number; name: string; countryId: number; countryCode: string; stateCode: string | null; type: string | null };
export type CityOption = { id: number; name: string; stateId: number; stateCode: string | null; countryId: number; countryCode: string; timezone: string | null };

export const useLocationsApi = () => {
  const { ownerApiFetch } = useApi();
  return useMemo(() => ({
    listCountries: async (): Promise<CountryOption[]> => (await ownerApiFetch('/locations/countries')).countries,
    listStates: async (countryId: number): Promise<StateOption[]> => (await ownerApiFetch(`/locations/countries/${countryId}/states`)).states,
    listCities: async (stateId: number): Promise<CityOption[]> => (await ownerApiFetch(`/locations/states/${stateId}/cities`)).cities,
    getPhoneCode: async (countryId: number): Promise<string | null> => (await ownerApiFetch(`/locations/countries/${countryId}/phone-code`)).phoneCode ?? null,
  }), [ownerApiFetch]);
};
