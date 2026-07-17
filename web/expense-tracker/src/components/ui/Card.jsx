export default function Card({ children, className = '', padding = 'md' }) {
  return (
    <div className={`card card-pad-${padding} ${className}`}>
      {children}
    </div>
  );
}
