type DataFilterFormProps = {
  placeholder: string;
  submitLabel: string;
  defaultValue?: string;
};

export function DataFilterForm({ placeholder, submitLabel, defaultValue = "" }: DataFilterFormProps) {
  return (
    <form className="filter-form" method="get">
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="filter-form__input"
      />
      <button type="submit" className="hero-link hero-link--primary">
        {submitLabel}
      </button>
    </form>
  );
}