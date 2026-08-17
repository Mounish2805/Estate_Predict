export function formatPrice(lakhs) {
  const numLakhs = Number(lakhs);
  if (numLakhs >= 100) {
    const crores = numLakhs / 100;
    return `₹${crores.toFixed(2)} Cr`;
  }
  return `₹${numLakhs.toFixed(2)} Lakh`;
}

export function formatDifference(lakhs, inr) {
  const absLakhs = Math.abs(Number(lakhs));
  const absInr = Math.abs(Number(inr));
  if (absLakhs >= 100) {
    const crores = absLakhs / 100;
    return `₹${crores.toFixed(2)} Cr`;
  }
  if (absLakhs >= 1) {
    return `₹${absLakhs.toFixed(2)} Lakh`;
  }
  return `₹${Math.round(absInr).toLocaleString('en-IN')}`;
}

export function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}
