type SearchFiltersProps = {
  categories: { id: string; name: string }[];
  initialQuery?: string;
  initialCategoryId?: string;
};

export function SearchFilters({
  categories,
  initialQuery,
  initialCategoryId
}: SearchFiltersProps) {
  return (
    <form className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
      <div className="flex-1">
        <label className="block text-xs font-medium text-neutral-600 mb-1">
          Buscar por nombre
        </label>
        <input
          name="q"
          defaultValue={initialQuery}
          placeholder="Ej. DJ, banda, cantante..."
          className="input"
        />
      </div>
      <div className="w-full md:w-56">
        <label className="block text-xs font-medium text-neutral-600 mb-1">
          Categoría
        </label>
        <select
          name="categoryId"
          defaultValue={initialCategoryId ?? ""}
          className="input"
        >
          <option value="">Todas las categorías</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2 pt-1 md:pt-6">
        <button type="submit" className="btn-primary">
          Buscar
        </button>
      </div>
    </form>
  );
}

