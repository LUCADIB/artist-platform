"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// =============================================================================
// Types
// =============================================================================

interface Category {
  id: string;
  name: string;
}

interface FormData {
  name: string;
  categoryId: string;
  city: string;
  whatsapp: string;
  profileImage: File | null;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  name?: string;
  categoryId?: string;
  city?: string;
  whatsapp?: string;
  profileImage?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

// =============================================================================
// Main Component
// =============================================================================

export default function ArtistRegisterPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form data state
  const [formData, setFormData] = useState<FormData>({
    name: "",
    categoryId: "",
    city: "",
    whatsapp: "",
    profileImage: null,
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Form errors state
  const [errors, setErrors] = useState<FormErrors>({});

  // UI state
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Total steps
  const totalSteps = 5;

  // Fetch categories on mount
  useEffect(() => {
    setCategoriesLoading(true);
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {
        // Silently fail - category selection will show empty state
      })
      .finally(() => {
        setCategoriesLoading(false);
      });
  }, []);

  // Debug: log step changes
  useEffect(() => {
    console.log("[Register] Current step:", currentStep);
  }, [currentStep]);

  // =============================================================================
  // Validation Functions
  // =============================================================================

  function validateStep(step: number): boolean {
    const newErrors: FormErrors = {};

    switch (step) {
      case 1:
        if (!formData.name.trim()) {
          newErrors.name = "El nombre artístico es obligatorio.";
        } else if (formData.name.trim().length < 2) {
          newErrors.name = "El nombre debe tener al menos 2 caracteres.";
        }
        break;

      case 2:
        // Only require category if categories are available
        if (categories.length > 0 && !formData.categoryId) {
          newErrors.categoryId = "Selecciona una categoría.";
        }
        if (!formData.city.trim()) {
          newErrors.city = "La ciudad es obligatoria.";
        }
        break;

      case 3:
        if (!formData.whatsapp.trim()) {
          newErrors.whatsapp = "El número de WhatsApp es obligatorio.";
        } else if (!/^\d{10,15}$/.test(formData.whatsapp.replace(/\D/g, ""))) {
          newErrors.whatsapp = "Ingresa un número válido (10-15 dígitos).";
        }
        if (!formData.profileImage) {
          newErrors.profileImage = "La foto de perfil es obligatoria.";
        }
        break;

      case 4:
        if (!formData.email.trim()) {
          newErrors.email = "El correo es obligatorio.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = "Ingresa un correo válido.";
        }
        if (!formData.password) {
          newErrors.password = "La contraseña es obligatoria.";
        } else if (formData.password.length < 6) {
          newErrors.password = "La contraseña debe tener al menos 6 caracteres.";
        }
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = "Las contraseñas no coinciden.";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // =============================================================================
  // Navigation Handlers
  // =============================================================================

  function goNext() {
    console.log("[Register] goNext called, currentStep:", currentStep);
    if (validateStep(currentStep)) {
      const nextStep = Math.min(currentStep + 1, totalSteps);
      console.log("[Register] Moving to step:", nextStep);
      setCurrentStep(nextStep);
    }
  }

  function goBack() {
    const prevStep = Math.max(currentStep - 1, 1);
    console.log("[Register] Moving back to step:", prevStep);
    setCurrentStep(prevStep);
  }

  // =============================================================================
  // Form Submission
  // =============================================================================

  async function handleSubmit() {
    setError(null);
    setLoading(true);

    try {
      // Step 1: Register artist
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          city: formData.city.trim() || null,
          category_id: formData.categoryId || null,
          whatsapp: formData.whatsapp.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al registrar. Intenta de nuevo.");
        return;
      }

      // Step 2: Upload profile image if registration succeeded
      if (data.artistId && formData.profileImage) {
        const uploadForm = new FormData();
        uploadForm.append("file", formData.profileImage);
        uploadForm.append("artistId", data.artistId);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadForm,
        });

        // If upload fails, log but don't block - user can upload later
        if (!uploadRes.ok) {
          console.error("[Registration] Image upload failed, but registration succeeded");
        }

        // Update artist with avatar URL
        const uploadData = await uploadRes.json();
        if (uploadData.url) {
          await fetch(`/api/artists/${data.artistId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ avatar_url: uploadData.url }),
          });
        }
      }

      // Success - redirect to artist dashboard
      router.push(data.redirectTo);
      router.refresh();
    } catch {
      setError("Ocurrió un error inesperado. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  // =============================================================================
  // Image Handler
  // =============================================================================

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, profileImage: "Selecciona una imagen válida." }));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, profileImage: "La imagen no puede superar 5MB." }));
      return;
    }

    setFormData((prev) => ({ ...prev, profileImage: file }));
    setImagePreview(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, profileImage: undefined }));
  }

  // =============================================================================
  // Shared Input Classes
  // =============================================================================

  const inputClass =
    "w-full rounded-xl border border-neutral-200 bg-white px-4 py-3.5 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200 transition";

  const labelClass = "block text-sm font-medium text-neutral-700 mb-2";

  // =============================================================================
  // Step Components
  // =============================================================================

  // Step 1: Artist Name
  function StepName() {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 px-4 pt-8 pb-4">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            Únete a QuitoShows
          </h2>
          <p className="text-neutral-500 mb-8">
            Empieza a recibir reservas hoy mismo.
          </p>

          <div>
            <label htmlFor="name" className={labelClass}>
              Nombre artístico o agrupación *
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, name: e.target.value }));
                setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              className={inputClass}
              placeholder="Ej: Los Hermanos García"
              disabled={loading}
              autoFocus
            />
            <p className="mt-2 text-sm text-neutral-500">
              Este será el nombre visible para los clientes.
            </p>
            {errors.name && (
              <p className="mt-2 text-sm text-red-600">{errors.name}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Category + City
  function StepCategoryCity() {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 px-4 pt-8 pb-4 overflow-y-auto">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            Cuéntanos qué haces
          </h2>
          <p className="text-neutral-500 mb-6">
            Selecciona tu categoría y ubicación.
          </p>

          {/* Category Selection */}
          <div className="mb-6">
            <label className={labelClass}>Categoría *</label>

            {/* Loading skeleton */}
            {categoriesLoading ? (
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border-2 border-neutral-100 bg-neutral-50 animate-pulse"
                  >
                    <div className="h-4 bg-neutral-200 rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : categories.length === 0 ? (
              /* Empty state - allow to continue without category */
              <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50">
                <p className="text-sm text-neutral-500">
                  No hay categorías disponibles. Puedes continuar sin seleccionar.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, categoryId: cat.id }));
                      setErrors((prev) => ({ ...prev, categoryId: undefined }));
                    }}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      formData.categoryId === cat.id
                        ? "border-neutral-900 bg-neutral-50"
                        : "border-neutral-200 bg-white hover:border-neutral-300"
                    }`}
                  >
                    <span className="font-medium text-neutral-900">{cat.name}</span>
                  </button>
                ))}
              </div>
            )}
            {errors.categoryId && (
              <p className="mt-2 text-sm text-red-600">{errors.categoryId}</p>
            )}
          </div>

          {/* City Input */}
          <div>
            <label htmlFor="city" className={labelClass}>
              Ciudad *
            </label>
            <input
              id="city"
              type="text"
              required
              value={formData.city}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, city: e.target.value }));
                setErrors((prev) => ({ ...prev, city: undefined }));
              }}
              className={inputClass}
              placeholder="Ej: Quito"
              disabled={loading}
            />
            {errors.city && (
              <p className="mt-2 text-sm text-red-600">{errors.city}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Step 3: WhatsApp + Profile Photo
  function StepWhatsAppPhoto() {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 px-4 pt-8 pb-4 overflow-y-auto">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            Haz que los clientes puedan encontrarte
          </h2>
          <p className="text-neutral-500 mb-6">
            WhatsApp y foto de perfil.
          </p>

          {/* WhatsApp Input */}
          <div className="mb-6">
            <label htmlFor="whatsapp" className={labelClass}>
              Número de WhatsApp *
            </label>
            <input
              id="whatsapp"
              type="tel"
              required
              value={formData.whatsapp}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, whatsapp: e.target.value }));
                setErrors((prev) => ({ ...prev, whatsapp: undefined }));
              }}
              className={inputClass}
              placeholder="593999999999"
              disabled={loading}
            />
            <p className="mt-2 text-sm text-neutral-500">
              Los clientes te contactarán por este número.
            </p>
            {errors.whatsapp && (
              <p className="mt-2 text-sm text-red-600">{errors.whatsapp}</p>
            )}
          </div>

          {/* Profile Image Upload */}
          <div>
            <label className={labelClass}>Foto de perfil *</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />

            {imagePreview ? (
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-neutral-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Vista previa"
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-3 px-4 rounded-xl border border-neutral-200 text-neutral-700 font-medium hover:bg-neutral-50 transition"
                >
                  Cambiar foto
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-8 rounded-xl border-2 border-dashed border-neutral-300 text-neutral-500 hover:border-neutral-400 hover:text-neutral-600 transition flex flex-col items-center gap-2"
              >
                <svg
                  className="w-10 h-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="font-medium">Subir foto</span>
              </button>
            )}

            <p className="mt-2 text-sm text-neutral-500">
              Sube una foto clara o el logo de tu agrupación.
            </p>
            {errors.profileImage && (
              <p className="mt-2 text-sm text-red-600">{errors.profileImage}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Step 4: Account Credentials
  function StepCredentials() {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 px-4 pt-8 pb-4 overflow-y-auto">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            Crea tus datos de acceso
          </h2>
          <p className="text-neutral-500 mb-6">
            Usarás estos datos para iniciar sesión.
          </p>

          {/* Email Input */}
          <div className="mb-5">
            <label htmlFor="email" className={labelClass}>
              Correo electrónico *
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, email: e.target.value }));
                setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              className={inputClass}
              placeholder="tu@correo.com"
              disabled={loading}
            />
            {errors.email && (
              <p className="mt-2 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Password Input */}
          <div className="mb-5">
            <label htmlFor="password" className={labelClass}>
              Contraseña *
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, password: e.target.value }));
                  setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                className={`${inputClass} pr-12`}
                placeholder="Mínimo 6 caracteres"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-2 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password Input */}
          <div>
            <label htmlFor="confirmPassword" className={labelClass}>
              Confirmar contraseña *
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }));
                  setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }}
                className={`${inputClass} pr-12`}
                placeholder="Repite tu contraseña"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Step 5: Final Confirmation
  function StepConfirmation() {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 px-4 pt-8 pb-4">
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">
            ¡Estás listo!
          </h2>

          {/* Summary Card */}
          <div className="bg-neutral-50 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-3 mb-4">
              {imagePreview ? (
                <div className="w-14 h-14 rounded-xl overflow-hidden border border-neutral-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Foto de perfil"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-xl bg-neutral-200 flex items-center justify-center">
                  <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
              <div>
                <p className="font-semibold text-neutral-900">{formData.name}</p>
                <p className="text-sm text-neutral-500">
                  {categories.find((c) => c.id === formData.categoryId)?.name || "Sin categoría"}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">Ciudad:</span>
                <span className="text-neutral-900">{formData.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">WhatsApp:</span>
                <span className="text-neutral-900">{formData.whatsapp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Correo:</span>
                <span className="text-neutral-900">{formData.email}</span>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <p className="text-amber-800 text-sm font-medium">
              Tu perfil será revisado antes de publicarse.
            </p>
          </div>

          <p className="text-sm text-neutral-500">
            Podrás editar tu información y agregar videos luego.
          </p>

          {/* Error message */}
          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // =============================================================================
  // Progress Indicator
  // =============================================================================

  function ProgressIndicator() {
    return (
      <div className="flex items-center justify-center gap-2 py-4 px-4">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div
            key={index}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index + 1 === currentStep
                ? "w-8 bg-neutral-900"
                : index + 1 < currentStep
                ? "w-4 bg-neutral-400"
                : "w-4 bg-neutral-200"
            }`}
          />
        ))}
      </div>
    );
  }

  // =============================================================================
  // Navigation Buttons
  // =============================================================================

  function NavigationButtons() {
    const isLastStep = currentStep === totalSteps;

    return (
      <div className="sticky bottom-0 bg-white border-t border-neutral-100 px-4 py-4">
        <div className="flex gap-3">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={goBack}
              disabled={loading}
              className="flex-1 py-3.5 px-4 rounded-xl border border-neutral-200 text-neutral-700 font-medium hover:bg-neutral-50 transition disabled:opacity-50"
            >
              Atrás
            </button>
          )}
          <button
            type="button"
            onClick={isLastStep ? handleSubmit : goNext}
            disabled={loading}
            className="flex-1 py-3.5 px-4 rounded-xl bg-neutral-900 text-white font-semibold hover:bg-neutral-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Creando perfil...</span>
              </>
            ) : isLastStep ? (
              "Crear perfil"
            ) : (
              "Continuar"
            )}
          </button>
        </div>
      </div>
    );
  }

  // =============================================================================
  // Render - CSS-based responsive layout (no hydration issues)
  // =============================================================================

  return (
    <>
      {/* ========== MOBILE WIZARD (hidden on md+) ========== */}
      <div className="fixed inset-0 bg-white flex flex-col md:hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={goBack}
              className="p-2 -ml-2 text-neutral-600 hover:text-neutral-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          ) : (
            <div className="w-10" />
          )}

          <ProgressIndicator />

          <a
            href="/login"
            className="text-sm font-medium text-neutral-500 hover:text-neutral-900"
          >
            Iniciar sesión
          </a>
        </header>

        {/* Step Content - conditional rendering */}
        <main className="flex-1 overflow-y-auto">
          {currentStep === 1 && <StepName />}
          {currentStep === 2 && <StepCategoryCity />}
          {currentStep === 3 && <StepWhatsAppPhoto />}
          {currentStep === 4 && <StepCredentials />}
          {currentStep === 5 && <StepConfirmation />}
        </main>

        {/* Navigation */}
        <NavigationButtons />
      </div>

      {/* ========== DESKTOP FORM (hidden below md) ========== */}
      <div className="hidden md:flex min-h-[calc(100vh-120px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="rounded-2xl border border-neutral-200 bg-white px-8 py-10 shadow-sm">
            {/* Heading */}
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                Registro de artista
              </h1>
              <p className="mt-1.5 text-sm text-neutral-500">
                Crea tu cuenta y comienza a recibir reservas
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="space-y-5"
            >
              {/* Artist Name */}
              <div>
                <label htmlFor="name-desktop" className={labelClass}>
                  Nombre artístico *
                </label>
                <input
                  id="name-desktop"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className={inputClass}
                  placeholder="Tu nombre artístico"
                  disabled={loading}
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email-desktop" className={labelClass}>
                  Correo electrónico *
                </label>
                <input
                  id="email-desktop"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  className={inputClass}
                  placeholder="tu@correo.com"
                  disabled={loading}
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password-desktop" className={labelClass}>
                  Contraseña *
                </label>
                <div className="relative">
                  <input
                    id="password-desktop"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                    className={`${inputClass} pr-10`}
                    placeholder="Mínimo 6 caracteres"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword-desktop" className={labelClass}>
                  Confirmar contraseña *
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword-desktop"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    className={`${inputClass} pr-10`}
                    placeholder="Repite tu contraseña"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* City */}
              <div>
                <label htmlFor="city-desktop" className={labelClass}>
                  Ciudad
                </label>
                <input
                  id="city-desktop"
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                  className={inputClass}
                  placeholder="¿En qué ciudad te encuentras?"
                  disabled={loading}
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category-desktop" className={labelClass}>
                  Categoría
                </label>
                <select
                  id="category-desktop"
                  value={formData.categoryId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, categoryId: e.target.value }))}
                  className={inputClass}
                  disabled={loading}
                >
                  <option value="">Selecciona una categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* WhatsApp */}
              <div>
                <label htmlFor="whatsapp-desktop" className={labelClass}>
                  WhatsApp
                </label>
                <input
                  id="whatsapp-desktop"
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData((prev) => ({ ...prev, whatsapp: e.target.value }))}
                  className={inputClass}
                  placeholder="Número de WhatsApp (ej: 593999999999)"
                  disabled={loading}
                />
                <p className="mt-1 text-xs text-neutral-400">
                  Solo visible para el administrador
                </p>
              </div>

              {/* Profile Image */}
              <div>
                <label className={labelClass}>Foto de perfil</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <div className="flex items-start gap-4">
                  {imagePreview && (
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-neutral-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreview}
                        alt="Vista previa"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                    >
                      <svg
                        className="h-4 w-4 text-neutral-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      Subir foto
                    </button>
                    {formData.profileImage && (
                      <p className="mt-1.5 text-xs text-neutral-500 truncate max-w-xs">
                        {formData.profileImage.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Info about approval */}
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Tu perfil será revisado por el administrador antes de aparecer
                públicamente en la plataforma.
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Registrando…" : "Crear cuenta"}
              </button>
            </form>

            {/* Login link */}
            <p className="mt-6 text-center text-sm text-neutral-500">
              ¿Ya tienes cuenta?{" "}
              <a
                href="/login"
                className="font-medium text-neutral-900 hover:underline"
              >
                Inicia sesión
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
