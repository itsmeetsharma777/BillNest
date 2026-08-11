import { useEffect, useState } from 'react'
import { CheckCircle2, X } from 'lucide-react'
import { Landing, AuthScreen } from './components/Landing'
import { AppShell, type View } from './components/Layout'
import { CustomerDashboard, CustomerSettings, Documents, NotificationsPanel, Purchases, UploadPurchase } from './components/CustomerViews'
import { Customers, InvoiceBuilder, Reports, ShopDashboard, ShopInvoices, ShopSettings, Warranties } from './components/ShopViews'
import { Button } from './components/ui'
import { customers as demoCustomers, invoices as demoInvoices, notifications as demoNotifications, shop } from './lib/demo-data'
import type { Customer, Invoice, Notification, Role } from './types'

type Screen = 'landing' | 'auth' | 'app'

const load = <T,>(key: string, fallback: T): T => {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback } catch { return fallback }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing')
  const [role, setRole] = useState<Role>('shopkeeper')
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register')
  const [view, setView] = useState<View>('dashboard')
  const [invoices, setInvoices] = useState<Invoice[]>(() => load('billnest-invoices', demoInvoices))
  const [customers, setCustomers] = useState<Customer[]>(() => load('billnest-customers', demoCustomers))
  const [notifications, setNotifications] = useState<Notification[]>(() => load('billnest-notifications', demoNotifications))
  const [toast, setToast] = useState('')

  useEffect(() => { localStorage.setItem('billnest-invoices', JSON.stringify(invoices)) }, [invoices])
  useEffect(() => { localStorage.setItem('billnest-customers', JSON.stringify(customers)) }, [customers])
  useEffect(() => { localStorage.setItem('billnest-notifications', JSON.stringify(notifications)) }, [notifications])
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(''), 3800); return () => window.clearTimeout(timer) }, [toast])
  const openAuth = (mode: 'login' | 'register', nextRole: Role) => { setAuthMode(mode); setRole(nextRole); setScreen('auth') }
  const logIn = () => { setScreen('app'); setView('dashboard'); setToast(`Welcome${authMode === 'register' ? ' to BillNest' : ' back'}.`) }
  const logout = () => { setScreen('landing'); setView('dashboard'); setToast('You have been logged out safely.') }
  const shopInvoices = invoices.filter(invoice => invoice.shopId === shop.id)
  const me = customers.find(customer => customer.id === 'cust-1') ?? customers[0]
  const myInvoices = invoices.filter(invoice => invoice.customerId === me?.id)
  const addShopInvoice = (invoice: Invoice, customer: Customer) => { setCustomers(current => current.some(entry => entry.id === customer.id) ? current : [...current, customer]); setInvoices(current => [invoice, ...current]); setNotifications(current => [{ id: crypto.randomUUID(), title: 'Invoice is ready', description: `${invoice.number} was added to your purchase history.`, date: 'Just now', read: false, type: 'invoice' }, ...current]) }
  const addOnlineInvoice = (invoice: Invoice) => { setInvoices(current => [invoice, ...current]); setNotifications(current => [{ id: crypto.randomUUID(), title: 'Purchase added', description: `${invoice.items[0].product} has been saved with its warranty details.`, date: 'Just now', read: false, type: 'upload' }, ...current]) }
  const unread = notifications.filter(notification => !notification.read).length
  if (screen === 'landing') return <><Landing onAuth={openAuth} /><Toast message={toast} onClose={() => setToast('')} /></>
  if (screen === 'auth') return <><AuthScreen mode={authMode} role={role} onBack={() => setScreen('landing')} onRole={setRole} onSubmit={logIn} /><Toast message={toast} onClose={() => setToast('')} /></>
  return <><AppShell role={role} view={view} onView={setView} onLogout={logout} notifications={unread}>{role === 'shopkeeper' ? <ShopContent view={view} invoices={shopInvoices} customers={customers} setInvoices={next => setInvoices(current => [...next, ...current.filter(invoice => invoice.shopId !== shop.id)])} onView={setView} toast={setToast} onSave={addShopInvoice} /> : <CustomerContent view={view} invoices={myInvoices} customer={me} onView={setView} notifications={notifications} setNotifications={setNotifications} toast={setToast} onCreate={addOnlineInvoice} />}</AppShell><Toast message={toast} onClose={() => setToast('')} /></>
}

function ShopContent({ view, invoices, customers, setInvoices, onView, toast, onSave }: { view: View; invoices: Invoice[]; customers: Customer[]; setInvoices: (invoices: Invoice[]) => void; onView: (view: View) => void; toast: (message: string) => void; onSave: (invoice: Invoice, customer: Customer) => void }) {
  if (view === 'create-invoice') return <InvoiceBuilder customers={customers} invoices={invoices} shop={shop} onSave={onSave} onExit={() => onView('invoices')} toast={toast} />
  if (view === 'invoices') return <ShopInvoices invoices={invoices} customers={customers} setInvoices={setInvoices} toast={toast} />
  if (view === 'customers') return <Customers invoices={invoices} customers={customers} />
  if (view === 'warranties') return <Warranties invoices={invoices} customers={customers} />
  if (view === 'reports') return <Reports invoices={invoices} />
  if (view === 'settings') return <ShopSettings shop={shop} toast={toast} />
  if (view === 'notifications') return <NotificationsPanel notifications={demoNotifications} setNotifications={() => undefined} />
  return <ShopDashboard invoices={invoices} customers={customers} onView={onView} />
}

function CustomerContent({ view, invoices, customer, onView, notifications, setNotifications, toast, onCreate }: { view: View; invoices: Invoice[]; customer: Customer; onView: (view: View) => void; notifications: Notification[]; setNotifications: (notifications: Notification[]) => void; toast: (message: string) => void; onCreate: (invoice: Invoice) => void }) {
  if (view === 'purchases') return <Purchases invoices={invoices} customer={customer} />
  if (view === 'warranties') return <Warranties invoices={invoices} customers={[customer]} customerMode />
  if (view === 'upload') return <UploadPurchase customer={customer} onCreate={onCreate} toast={toast} />
  if (view === 'documents') return <Documents invoices={invoices} customer={customer} />
  if (view === 'settings') return <CustomerSettings customer={customer} toast={toast} />
  if (view === 'notifications') return <NotificationsPanel notifications={notifications} setNotifications={setNotifications} />
  return <CustomerDashboard invoices={invoices} customer={customer} onView={onView} />
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  if (!message) return null
  return <div className="toast" role="status"><CheckCircle2 size={18} /><span>{message}</span><button onClick={onClose} aria-label="Dismiss notification"><X size={16} /></button></div>
}
