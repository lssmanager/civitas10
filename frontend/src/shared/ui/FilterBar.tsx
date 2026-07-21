import type { ReactNode } from "react";

export const FilterBar = ({
  searchLabel = "Search",
  searchValue,
  onSearchChange,
  children,
  onReset,
}: {
  searchLabel?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  children?: ReactNode;
  onReset: () => void;
}) => (
  <form className="civitas-filter-toolbar" role="search" data-civitas-pattern="filter-toolbar" onSubmit={(event) => event.preventDefault()}>
    <label className="civitas-form-field civitas-filter-toolbar-search">
      <span className="civitas-form-field-label">{searchLabel}</span>
      <input className="civitas-field" value={searchValue} onChange={(event) => onSearchChange(event.target.value)} />
    </label>
    <div className="civitas-filter-toolbar-controls">{children}</div>
    <button type="button" className="civitas-secondary-button" onClick={onReset}>Reset</button>
  </form>
);
