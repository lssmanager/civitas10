import { useEffect, useState } from 'react';
import { useResourceApi } from '../api/resource';
import { CountryOption, StateOption, CityOption, useLocationsApi } from '../api/locations';


const LOCATION_CATALOG_SOURCE = 'dr5hn/countries-states-cities-database' as const;

type CreateOrganizationFormData = {
  name: string;
  description: string;
  countryId: string;
  stateId: string;
  cityId: string;
  manualCity: string;
  phonePrefix: string;
};

const toOptionalNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};

export const buildCreateOrganizationPayload = (formData: CreateOrganizationFormData, options: { countries: CountryOption[]; states: StateOption[]; cities: CityOption[] }) => {
  const countryId = toOptionalNumber(formData.countryId);
  const stateId = toOptionalNumber(formData.stateId);
  const cityId = toOptionalNumber(formData.cityId);
  const selectedCountry = countryId ? options.countries.find(country => country.id === countryId) : undefined;
  const selectedState = stateId ? options.states.find(state => state.id === stateId) : undefined;
  const selectedCity = cityId ? options.cities.find(city => city.id === cityId) : undefined;
  const manualCity = formData.manualCity.trim() || undefined;
  const phonePrefix = formData.phonePrefix.trim() || selectedCountry?.phoneCode || undefined;
  const normalizedPhonePrefix = phonePrefix ? `+${phonePrefix.replace(/^\+/, '')}` : undefined;

  return {
    name: formData.name.trim(),
    description: formData.description.trim() || undefined,
    business: {
      country: selectedCountry?.name,
      state: selectedState?.name,
      city: selectedCity?.name || manualCity,
      phonePrefix: normalizedPhonePrefix,
      location: {
        countryId,
        stateId,
        cityId,
        manualCity,
        phonePrefix: normalizedPhonePrefix,
        countryCode: selectedCountry?.iso2,
        stateCode: selectedState?.stateCode || undefined,
        source: selectedCountry ? LOCATION_CATALOG_SOURCE : undefined,
      },
    },
  };
};

interface CreateOrganizationFormProps {
  onSuccess: (orgId: string, name?: string, description?: string) => void;
}

const CreateOrganizationForm = ({ onSuccess }: CreateOrganizationFormProps) => {
  const { createOrganization } = useResourceApi();
  const locationsApi = useLocationsApi();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    countryId: '',
    stateId: '',
    cityId: '',
    manualCity: '',
    phonePrefix: '',
  });
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [states, setStates] = useState<StateOption[]>([]);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [locationsError, setLocationsError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsCreating(true);
    
    try {
      const payload = buildCreateOrganizationPayload(formData, { countries, states, cities });
      const result = await createOrganization(payload);
      setFormData({ name: '', description: '', countryId: '', stateId: '', cityId: '', manualCity: '', phonePrefix: '' });
      onSuccess(result.data.id, result.data.name || payload.name, result.data.description || payload.description);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setError(`No pudimos crear la organización en Logto. ${message}`);
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    locationsApi.listCountries().then(setCountries).catch(() => setLocationsError('No pudimos cargar el catálogo de países. Puedes continuar sin bloquear el alta.'));
  }, [locationsApi]);

  useEffect(() => {
    const countryId = Number(formData.countryId);
    setStates([]); setCities([]);
    setFormData(prev => ({ ...prev, stateId: '', cityId: '', manualCity: '' }));
    if (!countryId) return;
    const selected = countries.find(country => country.id === countryId);
    setFormData(prev => ({ ...prev, phonePrefix: selected?.phoneCode ? `+${selected.phoneCode.replace(/^\+/, '')}` : '' }));
    locationsApi.listStates(countryId).then(setStates).catch(() => setStates([]));
    locationsApi.getPhoneCode(countryId).then(phoneCode => {
      if (phoneCode) setFormData(prev => ({ ...prev, phonePrefix: `+${phoneCode.replace(/^\+/, '')}` }));
    }).catch(() => undefined);
  }, [formData.countryId, countries, locationsApi]);

  useEffect(() => {
    const stateId = Number(formData.stateId);
    setCities([]);
    setFormData(prev => ({ ...prev, cityId: '', manualCity: '' }));
    if (!stateId) return;
    locationsApi.listCities(stateId).then(setCities).catch(() => setCities([]));
  }, [formData.stateId, locationsApi]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const inputClassName = "mt-1 block w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-300 placeholder-gray-400";
  const labelClassName = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm p-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Crear primera organización Civitas</h3>
      <p className="mb-6 text-sm text-gray-500">Alta canónica en Logto desde el espacio owner global.</p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className={labelClassName}>
            Organization Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className={inputClassName}
            placeholder="Enter organization name"
          />
        </div>
        <div>
          <label htmlFor="description" className={labelClassName}>
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className={inputClassName}
            placeholder="Enter organization description"
          />
        </div>
        <div>
          <label htmlFor="countryId" className={labelClassName}>País</label>
          <select id="countryId" name="countryId" value={formData.countryId} onChange={handleInputChange} className={inputClassName}>
            <option value="">Selecciona un país</option>
            {countries.map(country => <option key={country.id} value={country.id}>{country.emoji ? `${country.emoji} ` : ''}{country.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="stateId" className={labelClassName}>Región / estado</label>
          <select id="stateId" name="stateId" value={formData.stateId} onChange={handleInputChange} disabled={!formData.countryId || states.length === 0} className={inputClassName}>
            <option value="">{states.length ? 'Selecciona una región' : 'Sin regiones cargadas'}</option>
            {states.map(state => <option key={state.id} value={state.id}>{state.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="cityId" className={labelClassName}>Ciudad</label>
          <select id="cityId" name="cityId" value={formData.cityId} onChange={handleInputChange} disabled={!formData.stateId || cities.length === 0} className={inputClassName}>
            <option value="">{cities.length ? 'Selecciona una ciudad' : 'Usa ciudad manual si no aparece'}</option>
            {cities.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}
          </select>
          <input type="text" id="manualCity" name="manualCity" value={formData.manualCity} onChange={handleInputChange} className={`${inputClassName} mt-3`} placeholder="Ciudad manual (opcional si no aparece)" />
        </div>
        <div>
          <label htmlFor="phonePrefix" className={labelClassName}>Prefijo telefónico</label>
          <input type="text" id="phonePrefix" name="phonePrefix" value={formData.phonePrefix} onChange={handleInputChange} className={inputClassName} placeholder="+57" />
        </div>
        {locationsError && <div className="text-amber-700 text-sm bg-amber-50 px-4 py-2.5 rounded-lg">{locationsError}</div>}
        {error && (
          <div className="text-red-600 text-sm bg-red-50 px-4 py-2.5 rounded-lg">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={isCreating}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors duration-200 ease-in-out shadow-sm"
        >
          {isCreating ? 'Creating...' : 'Create Organization'}
        </button>
      </form>
    </div>
  );
};

export default CreateOrganizationForm;
