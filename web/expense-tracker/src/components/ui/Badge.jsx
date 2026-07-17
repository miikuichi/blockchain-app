const VARIANT_CLASS = {
  success: 'badge-success',
  pending: 'badge-pending',
  failed: 'badge-failed',
  info: 'badge-info',
};

export default function Badge({ label, variant = 'info' }) {
  return (
    <span className={`badge ${VARIANT_CLASS[variant] ?? 'badge-info'}`}>
      {label}
    </span>
  );
}
