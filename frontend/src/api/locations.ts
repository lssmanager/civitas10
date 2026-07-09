import { useMemo } from 'react';
import { APP_ENV } from '../env';

export type CountryOption = { id: number; name: string; iso2: string; phoneCode: string | null; emoji: string | null };
export type StateOption = { id: number; name: string; countryId: number; countryCode: string; stateCode: string | null; type: string | null };
export type CityOption = { id: number; name: string; stateId: number; stateCode: string | null; countryId: number; countryCode: string; timezone: string | null };

type CountriesResponse = { countries?: CountryOption[] } | CountryOption[];
type StatesResponse = { states?: StateOption[] } | StateOption[];
type CitiesResponse = { cities?: CityOption[] } | CityOption[];
type PhoneCodeResponse = { phoneCode?: string | null };

const joinApiUrl = (endpoint: string) => `${APP_ENV.api.url.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

const publicLocationFetch = async <T>(endpoint: string): Promise<T> => {
  const response = await fetch(joinApiUrl(endpoint), { headers: { Accept: 'application/json' } });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = typeof data?.message === 'string' ? data.message : `Location catalog request failed: ${response.status} ${response.statusText}`.trim();
    throw new Error(message);
  }
  return data as T;
};

const unwrapCountries = (response: CountriesResponse) => Array.isArray(response) ? response : response.countries ?? [];
const unwrapStates = (response: StatesResponse) => Array.isArray(response) ? response : response.states ?? [];
const unwrapCities = (response: CitiesResponse) => Array.isArray(response) ? response : response.cities ?? [];

export const useLocationsApi = () => useMemo(() => ({
  listCountries: async (): Promise<CountryOption[]> => unwrapCountries(await publicLocationFetch<CountriesResponse>('/locations/countries')),
  listStates: async (countryId: number): Promise<StateOption[]> => unwrapStates(await publicLocationFetch<StatesResponse>(`/locations/states?countryId=${countryId}`)),
  listCities: async (stateId: number): Promise<CityOption[]> => unwrapCities(await publicLocationFetch<CitiesResponse>(`/locations/cities?stateId=${stateId}`)),
  getPhoneCode: async (countryId: number): Promise<string | null> => (await publicLocationFetch<PhoneCodeResponse>(`/locations/countries/${countryId}/phone-code`)).phoneCode ?? null,
}), []);
