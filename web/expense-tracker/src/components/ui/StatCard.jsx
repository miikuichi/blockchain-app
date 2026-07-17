import Card from './Card';

export default function StatCard({ label, value, sub, icon: Icon }) {
  return (
    <Card className="stat-card">
      <div className="stat-header">
        <span className="stat-label">{label}</span>
        {Icon && (
          <div className="stat-icon-wrap">
            <Icon size={16} />
          </div>
        )}
      </div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </Card>
  );
}
