import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      gcTime: 1000 * 60 * 5, // 5 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const API_BASE = import.meta.env.VITE_API_URL || ''

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: unknown
  headers?: Record<string, string>
  token?: string | null
}

export class ApiError extends Error {
  status: number
  statusText: string
  data?: unknown

  constructor(status: number, statusText: string, data?: unknown) {
    super(`API Error: ${status} ${statusText}`)
    this.name = 'ApiError'
    this.status = status
    this.statusText = statusText
    this.data = data
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers = {}, token } = options

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  }

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new ApiError(response.status, response.statusText, data)
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null as T
  }

  return response.json()
}

// Type-safe API client
export const api = {
  // User endpoints
  users: {
    me: (token: string) => apiFetch<User>('/api/v1/users/me', { token }),
  },

  // Upload endpoints
  upload: {
    getPresignedUrl: (token: string, filename: string, contentType: string) =>
      apiFetch<PresignedUrlResponse>('/api/v1/upload/presigned', {
        method: 'POST',
        token,
        body: { filename, content_type: contentType },
      }),
  },

  // Validation endpoints
  validate: {
    image: (token: string, imagePath: string) =>
      apiFetch<ValidationResult>('/api/v1/validate', {
        method: 'POST',
        token,
        body: { image_path: imagePath },
      }),
  },

  // Job endpoints
  jobs: {
    create: (token: string, data: CreateJobRequest) =>
      apiFetch<Job>('/api/v1/jobs', {
        method: 'POST',
        token,
        body: data,
      }),
    list: (token: string) =>
      apiFetch<Job[]>('/api/v1/jobs', { token }),
    get: (token: string, id: string) =>
      apiFetch<Job>(`/api/v1/jobs/${id}`, { token }),
    cancel: (token: string, id: string) =>
      apiFetch<void>(`/api/v1/jobs/${id}`, { method: 'DELETE', token }),
  },

  // Credits endpoints
  credits: {
    packages: () => apiFetch<CreditPackage[]>('/api/v1/credits/packages'),
    checkout: (token: string, packageId: string) =>
      apiFetch<CheckoutSession>('/api/v1/credits/checkout', {
        method: 'POST',
        token,
        body: { package_id: packageId },
      }),
  },

  // Presets endpoints
  presets: {
    styles: () => apiFetch<StylePreset[]>('/api/v1/presets/styles'),
    backgrounds: () => apiFetch<BackgroundPreset[]>('/api/v1/presets/backgrounds'),
  },

  // Images endpoints
  images: {
    getDownloadUrl: (token: string, id: string) =>
      apiFetch<{ url: string }>(`/api/v1/images/${id}/download`, { token }),
    delete: (token: string, id: string) =>
      apiFetch<void>(`/api/v1/images/${id}`, { method: 'DELETE', token }),
  },
}

// Types (these should match backend schemas)
export type User = {
  id: string
  clerk_id: string
  email: string
  credits_balance: number
  lifetime_credits_used: number
  created_at: string
  updated_at: string
}

export type PresignedUrlResponse = {
  upload_url: string
  file_path: string
  expires_at: string
}

export type ValidationResult = {
  passed: boolean
  errors: string[]
  suggestions: string[]
  face_landmarks?: Record<string, number[]>
  quality_score?: number
}

export type JobStatus = 'pending' | 'validating' | 'processing' | 'completed' | 'failed'

export type Job = {
  id: string
  user_id: string
  status: JobStatus
  input_image_path: string
  style_preset: string | null
  background_option: string | null
  validation_passed: boolean | null
  validation_errors: string[] | null
  output_image_path: string | null
  thumbnail_path: string | null
  credits_charged: number
  processing_time_ms: number | null
  error_message: string | null
  created_at: string
  started_at: string | null
  completed_at: string | null
}

export type CreateJobRequest = {
  input_image_path: string
  style_preset?: string
  background_option?: string
}

export type CreditPackage = {
  id: string
  name: string
  credits: number
  price_cents: number
  stripe_price_id: string
  is_active: boolean
}

export type CheckoutSession = {
  checkout_url: string
  session_id: string
}

export type StylePreset = {
  id: string
  name: string
  description: string
  preview_url: string
}

export type BackgroundPreset = {
  id: string
  name: string
  type: 'solid' | 'gradient' | 'transparent'
  value: string
  preview_url: string
}
