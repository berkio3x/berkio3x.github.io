// Prefix a site-relative path with the configured base path.
// url('posts/') -> '/posts/' locally, '/<repo>/posts/' on a project site.
export function url(path = '') {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const clean = path.replace(/^\//, '');
  return `${base}/${clean}`;
}

export function formatDate(d: Date) {
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function readingMinutes(text: string) {
  return Math.max(1, Math.round(text.split(/\s+/).length / 230));
}
