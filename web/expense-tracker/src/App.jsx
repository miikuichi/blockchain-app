import { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Send from './pages/Send';

const PAGES = {
  dashboard: Dashboard,
  transactions: Transactions,
  send: Send,
};

export default function App() {
  const [page, setPage] = useState('dashboard');
  const PageComponent = PAGES[page] ?? Dashboard;

  return (
    <div className="app-layout">
      <Sidebar activePage={page} onNavigate={setPage} />
      <main className="main-content">
        <PageComponent onNavigate={setPage} />
      </main>
    </div>
  );
}
