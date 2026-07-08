// ─── Page Shell ─────────────────────────────────────────────────
import { Outlet } from 'react-router';
import { Nav } from './Nav';
import { BottomNav } from './BottomNav';
import './PageShell.css';

export function PageShell() {
  return (
    <div className="page-shell">
      <Nav />
      <main className="page-shell__main page-enter">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
