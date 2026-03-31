import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
})

// ── Token injection ───────────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Token refresh on 401 ─────────────────────────────────────────────────────
let isRefreshing = false
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = []

function processQueue(error: unknown, token: string | null): void {
  failedQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token!),
  )
  failedQueue = []
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    // Don't retry auth endpoints themselves
    if (original.url?.includes('/auth/')) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      const { data } = await axios.post<{ accessToken: string; refreshToken: string }>(
        `${BASE_URL}/auth/refresh`,
        { refreshToken: getRefreshToken() },
      )
      setAccessToken(data.accessToken)
      setRefreshToken(data.refreshToken)
      processQueue(null, data.accessToken)
      original.headers.Authorization = `Bearer ${data.accessToken}`
      return api(original)
    } catch (refreshError) {
      processQueue(refreshError, null)
      clearTokens()
      window.dispatchEvent(new CustomEvent('auth:logout'))
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

// ── Token store ───────────────────────────────────────────────────────────────
const ACCESS_KEY  = 'access_token'
const REFRESH_KEY = 'refresh_token'

let _accessToken: string | null = null

export function getAccessToken(): string | null  { return _accessToken }
export function setAccessToken(t: string): void  { _accessToken = t }

export function getRefreshToken(): string | null  { return localStorage.getItem(REFRESH_KEY) }
export function setRefreshToken(t: string): void  { localStorage.setItem(REFRESH_KEY, t) }

export function clearTokens(): void {
  _accessToken = null
  localStorage.removeItem(REFRESH_KEY)
}

// Keep backward-compat export used in auth store
export function clearAccessToken(): void { _accessToken = null }
