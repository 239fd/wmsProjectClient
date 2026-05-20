export function parseContentDispositionFilename(header) {
  if (!header || typeof header !== 'string') return null;

  const starMatch = header.match(/filename\*\s*=\s*([^']*)'([^']*)'([^;]+)/i);
  if (starMatch) {
    const charset = (starMatch[1] || 'UTF-8').toUpperCase();
    const encoded = starMatch[3].trim().replace(/^"+|"+$/g, '');
    try {
      if (charset === 'UTF-8' || charset === 'UTF8') {
        return decodeURIComponent(encoded);
      }
      return decodeURIComponent(encoded);
    } catch {
      return encoded;
    }
  }

  const plainMatch = header.match(/filename\s*=\s*"?([^";]+)"?/i);
  if (plainMatch) {
    return plainMatch[1].trim();
  }
  return null;
}

export function readFilenameFromResponse(response, fallback) {
  let header = null;
  if (response?.headers) {
    if (typeof response.headers.get === 'function') {
      header = response.headers.get('content-disposition') || response.headers.get('Content-Disposition');
    } else {
      header = response.headers['content-disposition'] || response.headers['Content-Disposition'];
    }
  }
  return parseContentDispositionFilename(header) || fallback;
}
