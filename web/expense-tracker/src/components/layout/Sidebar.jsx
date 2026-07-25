import { Wallet, LayoutDashboard, ArrowRightLeft, Send, Settings, ChevronRight, LogOut } from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: ArrowRightLeft },
  { id: 'send', label: 'Send Payment', icon: Send },
];

export default function Sidebar({ activePage, onNavigate, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Wallet size={22} className="logo-icon" />
        <span className="logo-text">ADA<span className="logo-accent">Pay</span></span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`nav-item ${activePage === id ? 'active' : ''}`}
            onClick={() => onNavigate(id)}
          >
            <Icon size={18} />
            <span>{label}</span>
            {activePage === id && <ChevronRight size={14} className="nav-chevron" />}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item" onClick={() => {}}>
          <Settings size={18} />
          <span>Settings</span>
        </button>

          <button
            className="nav-item"
            onClick={onLogout}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        <div className="network-badge">
          <span className="network-dot" />
          <span>Cardano Preprod</span>
        </div>
      </div>
    </aside>
  );
}
