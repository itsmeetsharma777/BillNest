import type { ReactNode } from 'react'
import { Bell, ChevronDown, HelpCircle, LayoutDashboard, LogOut, Menu, Monitor, Moon, Plus, Search, Settings, Store, Sun, Upload, UserRound, X } from 'lucide-react'
import { Button, Logo } from './ui'
import type { Role } from '../types'

export type View = 'dashboard' | 'invoices' | 'create-invoice' | 'customers' | 'warranties' | 'reports' | 'settings' | 'purchases' | 'upload' | 'documents' | 'notifications'
export type ThemePreference = 'light' | 'dark' | 'system'

const shopLinks: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard }, { id: 'invoices', label: 'Invoices', icon: Store }, { id: 'customers', label: 'Customers', icon: UserRound }, { id: 'warranties', label: 'Warranties', icon: Settings }, { id: 'reports', label: 'Reports', icon: Search },
]
const customerLinks: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard }, { id: 'purchases', label: 'My purchases', icon: Store }, { id: 'warranties', label: 'My warranties', icon: Settings }, { id: 'upload', label: 'Add online purchase', icon: Upload }, { id: 'documents', label: 'Documents', icon: Search },
]

export function AppShell({ role, view, onView, onLogout, notifications, workspaceName, profileName, theme, onThemeChange, children }: { role: Role; view: View; onView: (view: View) => void; onLogout: () => void; notifications: number; workspaceName: string; profileName: string; theme: ThemePreference; onThemeChange: (theme: ThemePreference) => void; children: ReactNode }) {
  const [first, ...links] = role === 'shopkeeper' ? shopLinks : customerLinks
  const roleName = workspaceName
  const roleInitials = profileName.split(/\s+/).filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'BN'
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="side-top"><Logo /><span className="workspace-label">{role === 'shopkeeper' ? 'WORKSPACE' : 'MY ACCOUNT'}</span></div>
      {role === 'shopkeeper' && <Button className="create-button" onClick={() => onView('create-invoice')}><Plus size={17} />Create invoice</Button>}
      <nav className="side-nav" aria-label="Main navigation">
        <button onClick={() => onView(first.id)} className={view === first.id ? 'active' : ''}><first.icon size={18} />{first.label}</button>
        {links.map(link => <button key={link.id} onClick={() => onView(link.id)} className={view === link.id ? 'active' : ''}><link.icon size={18} />{link.label}</button>)}
      </nav>
      <div className="side-bottom">
        <button onClick={() => onView('notifications')} className={view === 'notifications' ? 'active' : ''}><Bell size={18} />Notifications{notifications > 0 && <b>{notifications}</b>}</button>
        <button onClick={() => onView('settings')} className={view === 'settings' ? 'active' : ''}><Settings size={18} />Settings</button>
        <button><HelpCircle size={18} />Help & support</button>
        <button className="logout" onClick={onLogout}><LogOut size={18} />Log out</button>
      </div>
    </aside>
    <main className="main-area">
      <header className="topbar"><button className="mobile-menu" aria-label="Open navigation"><Menu size={22} /></button><div className="topbar-search"><Search size={17} /><input placeholder="Search invoices, customers…" /></div><div className="topbar-actions"><label className="theme-control" title="Choose theme"><span className="sr-only">Theme preference</span>{theme === 'dark' ? <Moon size={15} /> : theme === 'light' ? <Sun size={15} /> : <Monitor size={15} />}<select aria-label="Theme preference" value={theme} onChange={event => onThemeChange(event.target.value as ThemePreference)}><option value="light">Light</option><option value="dark">Dark</option><option value="system">System</option></select></label><button className="bell" onClick={() => onView('notifications')} aria-label="Open notifications"><Bell size={19} />{notifications > 0 && <i />}</button><button className="profile-chip" onClick={() => onView('settings')}><span>{roleInitials}</span><b>{roleName}</b><ChevronDown size={15} /></button></div></header>
      <div className="content">{children}</div>
    </main>
  </div>
}

export function MobileNav({ open, onClose, role, view, onView, onLogout }: { open: boolean; onClose: () => void; role: Role; view: View; onView: (v: View) => void; onLogout: () => void }) {
  const links = role === 'shopkeeper' ? shopLinks : customerLinks
  return <div className={`mobile-nav ${open ? 'open' : ''}`}><button className="drawer-close" onClick={onClose}><X /></button><Logo /><nav>{links.map(link => <button key={link.id} className={view === link.id ? 'active' : ''} onClick={() => { onView(link.id); onClose() }}><link.icon size={18} />{link.label}</button>)}<button onClick={onLogout}><LogOut size={18} />Log out</button></nav></div>
}
