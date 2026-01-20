import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { User, Job, ValidationResult } from '@/lib/api'

type UploadState = {
  file: File | null
  previewUrl: string | null
  uploadedPath: string | null
  isUploading: boolean
  uploadProgress: number
}

type GenerationState = {
  selectedStyle: string | null
  selectedBackground: string | null
  currentJob: Job | null
  isGenerating: boolean
}

type AppState = {
  // User state
  user: User | null
  setUser: (user: User | null) => void

  // Upload state
  upload: UploadState
  setUploadFile: (file: File | null) => void
  setUploadPreview: (url: string | null) => void
  setUploadedPath: (path: string | null) => void
  setIsUploading: (isUploading: boolean) => void
  setUploadProgress: (progress: number) => void
  resetUpload: () => void

  // Validation state
  validationResult: ValidationResult | null
  setValidationResult: (result: ValidationResult | null) => void

  // Generation state
  generation: GenerationState
  setSelectedStyle: (style: string | null) => void
  setSelectedBackground: (background: string | null) => void
  setCurrentJob: (job: Job | null) => void
  setIsGenerating: (isGenerating: boolean) => void
  resetGeneration: () => void

  // Reset all state
  resetAll: () => void
}

const initialUploadState: UploadState = {
  file: null,
  previewUrl: null,
  uploadedPath: null,
  isUploading: false,
  uploadProgress: 0,
}

const initialGenerationState: GenerationState = {
  selectedStyle: null,
  selectedBackground: null,
  currentJob: null,
  isGenerating: false,
}

export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      // User state
      user: null,
      setUser: (user) => set({ user }),

      // Upload state
      upload: initialUploadState,
      setUploadFile: (file) =>
        set((state) => ({ upload: { ...state.upload, file } })),
      setUploadPreview: (previewUrl) =>
        set((state) => ({ upload: { ...state.upload, previewUrl } })),
      setUploadedPath: (uploadedPath) =>
        set((state) => ({ upload: { ...state.upload, uploadedPath } })),
      setIsUploading: (isUploading) =>
        set((state) => ({ upload: { ...state.upload, isUploading } })),
      setUploadProgress: (uploadProgress) =>
        set((state) => ({ upload: { ...state.upload, uploadProgress } })),
      resetUpload: () => set({ upload: initialUploadState, validationResult: null }),

      // Validation state
      validationResult: null,
      setValidationResult: (validationResult) => set({ validationResult }),

      // Generation state
      generation: initialGenerationState,
      setSelectedStyle: (selectedStyle) =>
        set((state) => ({ generation: { ...state.generation, selectedStyle } })),
      setSelectedBackground: (selectedBackground) =>
        set((state) => ({ generation: { ...state.generation, selectedBackground } })),
      setCurrentJob: (currentJob) =>
        set((state) => ({ generation: { ...state.generation, currentJob } })),
      setIsGenerating: (isGenerating) =>
        set((state) => ({ generation: { ...state.generation, isGenerating } })),
      resetGeneration: () => set({ generation: initialGenerationState }),

      // Reset all
      resetAll: () =>
        set({
          upload: initialUploadState,
          validationResult: null,
          generation: initialGenerationState,
        }),
    }),
    { name: 'headshot-app' }
  )
)

// Selectors for optimized re-renders (rerender-derived-state)
export const useCreditsBalance = () => useAppStore((state) => state.user?.credits_balance ?? 0)
export const useHasCredits = () => useAppStore((state) => (state.user?.credits_balance ?? 0) > 0)
export const useIsUploading = () => useAppStore((state) => state.upload.isUploading)
export const useIsGenerating = () => useAppStore((state) => state.generation.isGenerating)
export const useValidationPassed = () => useAppStore((state) => state.validationResult?.passed ?? false)
