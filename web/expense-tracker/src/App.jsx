import { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Send from './pages/Send';
import LandingPage from "./pages/LandingPage";

const PAGES = {
  dashboard: Dashboard,
  transactions: Transactions,
  send: Send,
};

export default function App() {
  const [page, setPage] = useState('dashboard');
  const PageComponent = PAGES[page] ?? Dashboard;
  const [isLoggedIn, setIsLoggedIn] = useState(false);

   if (!isLoggedIn) {
    return (
      <LandingPage
        onLogin={() => setIsLoggedIn(true)}
      />
    );
  }
  
  return (
    <div className="app-layout">
      <Sidebar activePage={page} onNavigate={setPage} />
      <main className="main-content">
        <PageComponent onNavigate={setPage} />
      </main>
    </div>
  );
}
