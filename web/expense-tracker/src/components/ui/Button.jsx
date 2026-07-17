export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  onClick,
  disabled,
  className = '',
  type = 'button',
}) {
  return (
    <button
      type={type}
      className={`btn btn-${variant} btn-${size} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="btn-icon">{icon}</span>}
      {children}
    </button>
  );
}
