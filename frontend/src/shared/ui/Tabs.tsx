import { useId, type KeyboardEvent, type ReactNode } from "react";

export type TabItem<T extends string = string> = {
  id: T;
  label: ReactNode;
  status?: ReactNode;
  panel: ReactNode;
};

export const Tabs = <T extends string>({ items, activeId, onChange, label }: { items: TabItem<T>[]; activeId: T; onChange: (id: T) => void; label: string }) => {
  const generatedId = useId();
  const activeItem = items.find((item) => item.id === activeId) ?? items[0];

  const focusTab = (index: number) => {
    const target = document.getElementById(`${generatedId}-tab-${items[index]?.id}`);
    target?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const nextIndex = (index + direction + items.length) % items.length;
      onChange(items[nextIndex].id);
      focusTab(nextIndex);
    }
    if (event.key === "Home") {
      event.preventDefault();
      onChange(items[0].id);
      focusTab(0);
    }
    if (event.key === "End") {
      event.preventDefault();
      const lastIndex = items.length - 1;
      onChange(items[lastIndex].id);
      focusTab(lastIndex);
    }
  };

  return (
    <div className="civitas-tabs" data-civitas-tabs="true">
      <div className="civitas-tabs-list" role="tablist" aria-label={label}>
        {items.map((item, index) => {
          const selected = item.id === activeItem.id;
          return (
            <button
              key={item.id}
              id={`${generatedId}-tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${generatedId}-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              className="civitas-tab"
              data-selected={selected}
              onClick={() => onChange(item.id)}
              onKeyDown={(event) => onKeyDown(event, index)}
            >
              <span>{item.label}</span>
              {item.status ? <span className="civitas-tab-status">{item.status}</span> : null}
            </button>
          );
        })}
      </div>
      <section id={`${generatedId}-panel-${activeItem.id}`} role="tabpanel" tabIndex={0} aria-labelledby={`${generatedId}-tab-${activeItem.id}`} className="civitas-tab-panel">
        {activeItem.panel}
      </section>
    </div>
  );
};
