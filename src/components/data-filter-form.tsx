type DataFilterFormProps = {
  placeholder: string;
  defaultValue?: string;
};

export function DataFilterForm({ placeholder, defaultValue = "" }: DataFilterFormProps) {
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
        Filtrar
      </button>
    </form>
  );
}