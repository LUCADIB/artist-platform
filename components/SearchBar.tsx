"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type Category = {
  id: string;
  name: string;
};

interface SearchBarProps {
  categories: Category[];
  initialQuery?: string;
  initialCategoryId?: string;
  basePath?: string;
}

export function SearchBar({
  categories,
  initialQuery,
  initialCategoryId,
  basePath = "/"
}: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(initialQuery ?? "");
  const [categoryId, setCategoryId] = useState(initialCategoryId ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const params = new URLSearchParams(searchParams?.toString() ?? "");

    if (query) {
      params.set("q", query);
    } else {
      params.delete("q");
    }

    if (categoryId) {
      params.set("categoryId", categoryId);
    } else {
      params.delete("categoryId");
    }

    router.push(`${basePath}?${params.toString()}`);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 md:grid md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto] md:items-end"
    >
      <div className="flex flex-col gap-1">
        <label
          htmlFor="search-name"
          className="text-xs font-medium text-neutral-600"
        >
          Buscar por nombre
        </label>
        <input
          id="search-name"
          className="input"
          placeholder="Ej. DJ, banda, show..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="search-category"
          className="text-xs font-medium text-neutral-600"
        >
          Categoría
        </label>
        <select
          id="search-category"
          className="input"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="btn-primary mt-1 w-full md:mt-0 md:h-[42px] md:w-auto"
      >
        Buscar
      </button>
    </form>
  );
}

