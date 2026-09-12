const apiBaseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const apiUrl = (path: string) => `${apiBaseUrl}/api${path}`;
const csrfToken = () => document.cookie.split('; ').find(value => value.startsWith('techlabs_csrf='))?.split('=').slice(1).join('=') || '';

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(apiUrl(path), {
    headers: {
      'Content-Type': 'application/json',
      ...(!['GET', 'HEAD', 'OPTIONS'].includes(options.method?.toUpperCase() || 'GET') && csrfToken() ? { 'X-CSRF-Token': decodeURIComponent(csrfToken()) } : {}),
      ...(options.headers || {}),
    },
    credentials: 'include',
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    try {
      const parsed = JSON.parse(errorText) as { error?: string };
      throw new Error(parsed.error || errorText || 'Request failed');
    } catch (error) {
      if (error instanceof Error && error.message !== 'Unexpected end of JSON input' && !error.message.startsWith('Unexpected token')) throw error;
      throw new Error(errorText || 'Request failed');
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function setApiSession(token?: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('techlabs_session');
}

export async function apiDownload(path: string, body: unknown, filename: string): Promise<void> {
  const response = await fetch(apiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(csrfToken() ? { 'X-CSRF-Token': decodeURIComponent(csrfToken()) } : {}) },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await response.text() || 'Download failed');
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = url; link.download = filename; link.click();
  URL.revokeObjectURL(url);
}

export async function apiUpload<T>(path: string, file: File, extraHeaders: Record<string, string> = {}): Promise<T> {
  const response = await fetch(apiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': file.type, 'X-File-Name': encodeURIComponent(file.name), ...(csrfToken() ? { 'X-CSRF-Token': decodeURIComponent(csrfToken()) } : {}), ...extraHeaders },
    credentials: 'include',
    body: file,
  });
  if (!response.ok) throw new Error(await response.text() || 'Upload failed');
  return response.json() as Promise<T>;
}

export async function apiOpenPrivate(path: string): Promise<void> {
  const response = await fetch(apiUrl(path), { credentials: 'include' });
  if (!response.ok) throw new Error(await response.text() || 'File could not be opened');
  const url = URL.createObjectURL(await response.blob());
  window.open(url, '_blank', 'noopener,noreferrer');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function apiGetPrivateBlob(path: string): Promise<{ url: string; type: string }> {
  const response = await fetch(apiUrl(path), { credentials: 'include' });
  if (!response.ok) throw new Error(await response.text() || 'File could not be loaded');
  const blob = await response.blob();
  return { url: URL.createObjectURL(blob), type: blob.type };
}
