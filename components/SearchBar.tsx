"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

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
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search-suggestions?q=${query}`);
        const data = await res.json();

        // 🔥 si solo hay una coincidencia EXACTA → no mostrar dropdown
        if (data.length === 1 && data[0].toLowerCase() === query.toLowerCase()) {
          setSuggestions([]);
          setShowSuggestions(false);
          return;
        }

        setSuggestions(data);
        setShowSuggestions(true);
      } catch (e) {
        console.error(e);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [query]);

  function selectSuggestion(text: string) {
    setQuery(text);

    // 🔥 limpiar dropdown correctamente
    setSuggestions([]);
    setShowSuggestions(false);

    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("q", text);

    router.push(`${basePath}?${params.toString()}`, { scroll: false });

    // 🔥 bajar automáticamente a resultados
    setTimeout(() => {
      const el = document.getElementById("results");
      if (el) {
        el.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    }, 350);
  }

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

    router.push(`${basePath}?${params.toString()}`, { scroll: false });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 md:grid md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto] md:items-end"
    >
      <div className="flex flex-col gap-1 relative">
        <label className="text-xs font-medium text-neutral-600">
          Buscar artistas o categorías
        </label>

        <input
          className="input text-base"
          placeholder="Ej. DJ, banda, show..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
        />

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full mt-1 w-full bg-white border border-neutral-200 rounded-xl shadow-xl z-50 overflow-y-auto max-h-64">
            {suggestions.map((s, i) => (
              <div
                key={i}
                onMouseDown={() => selectSuggestion(s)}
                className="px-4 py-3 text-sm hover:bg-neutral-100 cursor-pointer"
              >
                {s}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-neutral-600">
          Categoría
        </label>

        <select
          className="input text-base"
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