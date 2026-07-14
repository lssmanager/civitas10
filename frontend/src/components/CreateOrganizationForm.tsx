import { useState } from 'react';
import { useResourceApi } from '../api/resource';
import { AlertStrip } from '../shared/ui';

interface CreateOrganizationFormProps {
  onSuccess: (orgId: string, name?: string, description?: string) => void;
}

const CreateOrganizationForm = ({ onSuccess }: CreateOrganizationFormProps) => {
  const { createOrganization } = useResourceApi();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsCreating(true);

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      };
      const result = await createOrganization(payload);
      setFormData({ name: '', description: '' });
      onSuccess(result.data.id, result.data.name || payload.name, result.data.description || payload.description);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setError(`No pudimos crear la organización en Logto. ${message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const inputClassName = "mt-1 block w-full px-4 py-3 bg-surface border border-border rounded-lg text-text text-sm transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-focus focus:border-transparent hover:border-border-strong placeholder-muted";
  const labelClassName = "block text-sm font-medium text-muted-strong mb-1";

  return (
    <div className="max-w-md mx-auto bg-surface rounded-xl shadow-sm p-8">
      <h3 className="text-xl font-semibold text-text mb-2">Crear primera organización Civitas</h3>
      <p className="mb-6 text-sm text-muted">Alta canónica en Logto desde el espacio owner global.</p>
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
        {error && (
          <AlertStrip variant="danger" title="Could not create organization">
            {error}
          </AlertStrip>
        )}
        <button
          type="submit"
          disabled={isCreating}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-primary-contrast bg-primary hover:bg-primary-strong focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-focus disabled:opacity-50 transition-colors duration-200 ease-in-out shadow-sm"
        >
          {isCreating ? 'Creating...' : 'Create Organization'}
        </button>
      </form>
    </div>
  );
};

export default CreateOrganizationForm;
