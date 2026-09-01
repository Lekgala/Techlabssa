export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('techlabs_session') : null;
  const response = await fetch(`/api${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
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
  if (token) localStorage.setItem('techlabs_session', token);
  else localStorage.removeItem('techlabs_session');
}

export async function apiDownload(path: string, body: unknown, filename: string): Promise<void> {
  const token = localStorage.getItem('techlabs_session');
  const response = await fetch(`/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await response.text() || 'Download failed');
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = url; link.download = filename; link.click();
  URL.revokeObjectURL(url);
}

export async function apiUpload<T>(path: string, file: File, extraHeaders: Record<string, string> = {}): Promise<T> {
  const token = localStorage.getItem('techlabs_session');
  const response = await fetch(`/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': file.type, 'X-File-Name': encodeURIComponent(file.name), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extraHeaders },
    body: file,
  });
  if (!response.ok) throw new Error(await response.text() || 'Upload failed');
  return response.json() as Promise<T>;
}

export async function apiOpenPrivate(path: string): Promise<void> {
  const token = localStorage.getItem('techlabs_session');
  const response = await fetch(`/api${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!response.ok) throw new Error(await response.text() || 'File could not be opened');
  const url = URL.createObjectURL(await response.blob());
  window.open(url, '_blank', 'noopener,noreferrer');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function apiGetPrivateBlob(path: string): Promise<{ url: string; type: string }> {
  const token = localStorage.getItem('techlabs_session');
  const response = await fetch(`/api${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!response.ok) throw new Error(await response.text() || 'File could not be loaded');
  const blob = await response.blob();
  return { url: URL.createObjectURL(blob), type: blob.type };
}
