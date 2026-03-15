"use client";

import { useState, useEffect, useRef, useCallback, memo } from "react";
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
// Shared Input Classes
// =============================================================================

const inputClass =
  "w-full rounded-xl border border-neutral-200 bg-white px-4 py-3.5 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200 transition";

const labelClass = "block text-sm font-medium text-neutral-700 mb-2";

// =============================================================================
// Step 1: Artist Name (Memoized - defined OUTSIDE main component)
// =============================================================================

interface StepNameProps {
  name: string;
  error?: string;
  disabled: boolean;
  onNameChange: (value: string) => void;
  onErrorClear: () => void;
}

const StepName = memo(function StepName({
  name,
  error,
  disabled,
  onNameChange,
  onErrorClear,
}: StepNameProps) {
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
            inputMode="text"
            autoComplete="name"
            autoCorrect="off"
            autoCapitalize="words"
            spellCheck="false"
            required
            value={name}
            onChange={(e) => {
              onNameChange(e.target.value);
              if (error) onErrorClear();
            }}
            className={inputClass}
            placeholder="Ej: Los Hermanos García"
            disabled={disabled}
          />
          <p className="mt-2 text-sm text-neutral-500">
            Este será el nombre visible para los clientes.
          </p>
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
});

// =============================================================================
// Step 2: Category + City (Memoized)
// =============================================================================

interface StepCategoryCityProps {
  categories: Category[];
  categoriesLoading: boolean;
  categoryId: string;
  city: string;
  categoryIdError?: string;
  cityError?: string;
  disabled: boolean;
  onCategoryChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onCategoryErrorClear: () => void;
  onCityErrorClear: () => void;
}

const StepCategoryCity = memo(function StepCategoryCity({
  categories,
  categoriesLoading,
  categoryId,
  city,
  categoryIdError,
  cityError,
  disabled,
  onCategoryChange,
  onCityChange,
  onCategoryErrorClear,
  onCityErrorClear,
}: StepCategoryCityProps) {
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
                    onCategoryChange(cat.id);
                    if (categoryIdError) onCategoryErrorClear();
                  }}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    categoryId === cat.id
                      ? "border-neutral-900 bg-neutral-50"
                      : "border-neutral-200 bg-white hover:border-neutral-300"
                  }`}
                >
                  <span className="font-medium text-neutral-900">{cat.name}</span>
                </button>
              ))}
            </div>
          )}
          {categoryIdError && (
            <p className="mt-2 text-sm text-red-600">{categoryIdError}</p>
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
            inputMode="text"
            autoComplete="address-level2"
            autoCorrect="off"
            autoCapitalize="words"
            spellCheck="false"
            required
            value={city}
            onChange={(e) => {
              onCityChange(e.target.value);
              if (cityError) onCityErrorClear();
            }}
            className={inputClass}
            placeholder="Ej: Quito"
            disabled={disabled}
          />
          {cityError && (
            <p className="mt-2 text-sm text-red-600">{cityError}</p>
          )}
        </div>
      </div>
    </div>
  );
});

// =============================================================================
// Step 3: WhatsApp + Profile Photo (Memoized)
// =============================================================================

interface StepWhatsAppPhotoProps {
  whatsapp: string;
  imagePreview: string | null;
  whatsappError?: string;
  profileImageError?: string;
  disabled: boolean;
  onWhatsappChange: (value: string) => void;
  onImageChange: (file: File) => void;
  onWhatsappErrorClear: () => void;
  onProfileImageErrorClear: () => void;
}

const StepWhatsAppPhoto = memo(function StepWhatsAppPhoto({
  whatsapp,
  imagePreview,
  whatsappError,
  profileImageError,
  disabled,
  onWhatsappChange,
  onImageChange,
  onWhatsappErrorClear,
  onProfileImageErrorClear,
}: StepWhatsAppPhotoProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      onProfileImageErrorClear();
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      onProfileImageErrorClear();
      return;
    }

    onImageChange(file);
  }, [onImageChange, onProfileImageErrorClear]);

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
            inputMode="tel"
            autoComplete="tel"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            required
            value={whatsapp}
            onChange={(e) => {
              onWhatsappChange(e.target.value);
              if (whatsappError) onWhatsappErrorClear();
            }}
            className={inputClass}
            placeholder="593999999999"
            disabled={disabled}
          />
          <p className="mt-2 text-sm text-neutral-500">
            Los clientes te contactarán por este número.
          </p>
          {whatsappError && (
            <p className="mt-2 text-sm text-red-600">{whatsappError}</p>
          )}
        </div>

        {/* Profile Image Upload */}
        <div>
          <label className={labelClass}>Foto de perfil *</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
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
          {profileImageError && (
            <p className="mt-2 text-sm text-red-600">{profileImageError}</p>
          )}
        </div>
      </div>
    </div>
  );
});

// =============================================================================
// Step 4: Account Credentials (Memoized)
// =============================================================================

interface StepCredentialsProps {
  email: string;
  password: string;
  confirmPassword: string;
  emailError?: string;
  passwordError?: string;
  confirmPasswordError?: string;
  disabled: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onEmailErrorClear: () => void;
  onPasswordErrorClear: () => void;
  onConfirmPasswordErrorClear: () => void;
}

const StepCredentials = memo(function StepCredentials({
  email,
  password,
  confirmPassword,
  emailError,
  passwordError,
  confirmPasswordError,
  disabled,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onEmailErrorClear,
  onPasswordErrorClear,
  onConfirmPasswordErrorClear,
}: StepCredentialsProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
            inputMode="email"
            autoComplete="email"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            required
            value={email}
            onChange={(e) => {
              onEmailChange(e.target.value);
              if (emailError) onEmailErrorClear();
            }}
            className={inputClass}
            placeholder="tu@correo.com"
            disabled={disabled}
          />
          {emailError && (
            <p className="mt-2 text-sm text-red-600">{emailError}</p>
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
              inputMode="text"
              autoComplete="new-password"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              required
              value={password}
              onChange={(e) => {
                onPasswordChange(e.target.value);
                if (passwordError) onPasswordErrorClear();
              }}
              className={`${inputClass} pr-12`}
              placeholder="Mínimo 6 caracteres"
              disabled={disabled}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1"
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
          {passwordError && (
            <p className="mt-2 text-sm text-red-600">{passwordError}</p>
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
              inputMode="text"
              autoComplete="new-password"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              required
              value={confirmPassword}
              onChange={(e) => {
                onConfirmPasswordChange(e.target.value);
                if (confirmPasswordError) onConfirmPasswordErrorClear();
              }}
              className={`${inputClass} pr-12`}
              placeholder="Repite tu contraseña"
              disabled={disabled}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1"
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
          {confirmPasswordError && (
            <p className="mt-2 text-sm text-red-600">{confirmPasswordError}</p>
          )}
        </div>
      </div>
    </div>
  );
});

// =============================================================================
// Step 5: Final Confirmation (Memoized)
// =============================================================================

interface StepConfirmationProps {
  name: string;
  categoryName: string;
  city: string;
  whatsapp: string;
  email: string;
  imagePreview: string | null;
  error: string | null;
}

const StepConfirmation = memo(function StepConfirmation({
  name,
  categoryName,
  city,
  whatsapp,
  email,
  imagePreview,
  error,
}: StepConfirmationProps) {
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
              <p className="font-semibold text-neutral-900">{name}</p>
              <p className="text-sm text-neutral-500">
                {categoryName || "Sin categoría"}
              </p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">Ciudad:</span>
              <span className="text-neutral-900">{city}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">WhatsApp:</span>
              <span className="text-neutral-900">{whatsapp}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Correo:</span>
              <span className="text-neutral-900">{email}</span>
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

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
});

// =============================================================================
// Progress Indicator (Memoized)
// =============================================================================

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const ProgressIndicator = memo(function ProgressIndicator({
  currentStep,
  totalSteps,
}: ProgressIndicatorProps) {
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
});

// =============================================================================
// Navigation Buttons (Memoized)
// =============================================================================

interface NavigationButtonsProps {
  currentStep: number;
  totalSteps: number;
  loading: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

const NavigationButtons = memo(function NavigationButtons({
  currentStep,
  totalSteps,
  loading,
  onBack,
  onNext,
  onSubmit,
}: NavigationButtonsProps) {
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="flex-shrink-0 bg-white border-t border-neutral-100 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="flex gap-3">
        {currentStep > 1 && (
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="flex-1 py-3.5 px-4 rounded-xl border border-neutral-200 text-neutral-700 font-medium hover:bg-neutral-50 active:bg-neutral-100 transition disabled:opacity-50"
          >
            Atrás
          </button>
        )}
        <button
          type="button"
          onClick={isLastStep ? onSubmit : onNext}
          disabled={loading}
          className="flex-1 py-3.5 px-4 rounded-xl bg-neutral-900 text-white font-semibold hover:bg-neutral-800 active:bg-neutral-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
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
});

// =============================================================================
// Main Component
// =============================================================================

export default function ArtistRegisterPage() {
  const router = useRouter();
  const desktopFileInputRef = useRef<HTMLInputElement>(null);

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

  // Desktop password visibility
  const [showDesktopPassword, setShowDesktopPassword] = useState(false);
  const [showDesktopConfirmPassword, setShowDesktopConfirmPassword] = useState(false);

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
        // Silently fail
      })
      .finally(() => {
        setCategoriesLoading(false);
      });
  }, []);

  // =============================================================================
  // Stable Callbacks (prevent re-renders)
  // =============================================================================

  const updateFormData = useCallback((updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const clearError = useCallback((field: keyof FormErrors) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  // Field-specific callbacks
  const handleNameChange = useCallback((value: string) => {
    updateFormData({ name: value });
  }, [updateFormData]);

  const handleCategoryChange = useCallback((value: string) => {
    updateFormData({ categoryId: value });
  }, [updateFormData]);

  const handleCityChange = useCallback((value: string) => {
    updateFormData({ city: value });
  }, [updateFormData]);

  const handleWhatsappChange = useCallback((value: string) => {
    updateFormData({ whatsapp: value });
  }, [updateFormData]);

  const handleEmailChange = useCallback((value: string) => {
    updateFormData({ email: value });
  }, [updateFormData]);

  const handlePasswordChange = useCallback((value: string) => {
    updateFormData({ password: value });
  }, [updateFormData]);

  const handleConfirmPasswordChange = useCallback((value: string) => {
    updateFormData({ confirmPassword: value });
  }, [updateFormData]);

  const handleImageChange = useCallback((file: File) => {
    updateFormData({ profileImage: file });
    setImagePreview(URL.createObjectURL(file));
    clearError("profileImage");
  }, [updateFormData, clearError]);

  // =============================================================================
  // Validation
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
  // Navigation
  // =============================================================================

  const goNext = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  }, [currentStep, formData, categories.length]);

  const goBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  // =============================================================================
  // Form Submission
  // =============================================================================

  async function handleSubmit() {
    setError(null);
    setLoading(true);

    try {
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

      if (data.artistId && formData.profileImage) {
        const uploadForm = new FormData();
        uploadForm.append("file", formData.profileImage);
        uploadForm.append("artistId", data.artistId);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadForm,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          if (uploadData.url) {
            await fetch(`/api/artists/${data.artistId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ avatar_url: uploadData.url }),
            });
          }
        }
      }

      router.push(data.redirectTo);
      router.refresh();
    } catch {
      setError("Ocurrió un error inesperado. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  // Desktop image handler
  const handleDesktopImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) return;

    handleImageChange(file);
  }, [handleImageChange]);

  // Get category name for confirmation step
  const categoryName = categories.find((c) => c.id === formData.categoryId)?.name || "";

  // =============================================================================
  // Render
  // =============================================================================

  return (
    <>
      {/* ========== MOBILE WIZARD (hidden on md+) ========== */}
      <div className="min-h-[100dvh] bg-white flex flex-col md:hidden">
        {/* Header */}
        <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-neutral-100">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={goBack}
              className="p-2 -ml-2 text-neutral-600 hover:text-neutral-900 active:text-neutral-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          ) : (
            <div className="w-10" />
          )}

          <ProgressIndicator currentStep={currentStep} totalSteps={totalSteps} />

          <a
            href="/login"
            className="text-sm font-medium text-neutral-500 hover:text-neutral-900"
          >
            Iniciar sesión
          </a>
        </header>

        {/* Step Content */}
        <main className="flex-1 overflow-y-auto">
          {currentStep === 1 && (
            <StepName
              name={formData.name}
              error={errors.name}
              disabled={loading}
              onNameChange={handleNameChange}
              onErrorClear={() => clearError("name")}
            />
          )}
          {currentStep === 2 && (
            <StepCategoryCity
              categories={categories}
              categoriesLoading={categoriesLoading}
              categoryId={formData.categoryId}
              city={formData.city}
              categoryIdError={errors.categoryId}
              cityError={errors.city}
              disabled={loading}
              onCategoryChange={handleCategoryChange}
              onCityChange={handleCityChange}
              onCategoryErrorClear={() => clearError("categoryId")}
              onCityErrorClear={() => clearError("city")}
            />
          )}
          {currentStep === 3 && (
            <StepWhatsAppPhoto
              whatsapp={formData.whatsapp}
              imagePreview={imagePreview}
              whatsappError={errors.whatsapp}
              profileImageError={errors.profileImage}
              disabled={loading}
              onWhatsappChange={handleWhatsappChange}
              onImageChange={handleImageChange}
              onWhatsappErrorClear={() => clearError("whatsapp")}
              onProfileImageErrorClear={() => clearError("profileImage")}
            />
          )}
          {currentStep === 4 && (
            <StepCredentials
              email={formData.email}
              password={formData.password}
              confirmPassword={formData.confirmPassword}
              emailError={errors.email}
              passwordError={errors.password}
              confirmPasswordError={errors.confirmPassword}
              disabled={loading}
              onEmailChange={handleEmailChange}
              onPasswordChange={handlePasswordChange}
              onConfirmPasswordChange={handleConfirmPasswordChange}
              onEmailErrorClear={() => clearError("email")}
              onPasswordErrorClear={() => clearError("password")}
              onConfirmPasswordErrorClear={() => clearError("confirmPassword")}
            />
          )}
          {currentStep === 5 && (
            <StepConfirmation
              name={formData.name}
              categoryName={categoryName}
              city={formData.city}
              whatsapp={formData.whatsapp}
              email={formData.email}
              imagePreview={imagePreview}
              error={error}
            />
          )}
        </main>

        {/* Navigation */}
        <NavigationButtons
          currentStep={currentStep}
          totalSteps={totalSteps}
          loading={loading}
          onBack={goBack}
          onNext={goNext}
          onSubmit={handleSubmit}
        />
      </div>

      {/* ========== DESKTOP FORM (hidden below md) ========== */}
      <div className="hidden md:flex min-h-[calc(100vh-120px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-neutral-200 bg-white px-8 py-10 shadow-sm">
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
                  autoComplete="name"
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
                  inputMode="email"
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
                    type={showDesktopPassword ? "text" : "password"}
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
                    onClick={() => setShowDesktopPassword(!showDesktopPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    tabIndex={-1}
                  >
                    {showDesktopPassword ? (
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
                    type={showDesktopConfirmPassword ? "text" : "password"}
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
                    onClick={() => setShowDesktopConfirmPassword(!showDesktopConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    tabIndex={-1}
                  >
                    {showDesktopConfirmPassword ? (
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
                  autoComplete="address-level2"
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
                  inputMode="tel"
                  autoComplete="tel"
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
                  ref={desktopFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleDesktopImageChange}
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
                      onClick={() => desktopFileInputRef.current?.click()}
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

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Tu perfil será revisado por el administrador antes de aparecer
                públicamente en la plataforma.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Registrando…" : "Crear cuenta"}
              </button>
            </form>

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
