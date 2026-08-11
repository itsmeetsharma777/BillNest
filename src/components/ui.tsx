import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Check, ChevronDown, Copy, Search, X } from 'lucide-react'
import type { InvoiceStatus, WarrantyStatus } from '../types'

export function Logo({ compact = false }: { compact?: boolean }) {
  return <div className="logo" aria-label="BillNest home"><span className="logo-mark"><span /></span>{!compact && <span>Bill<span>Nest</span></span>}</div>
}

export function Button({ children, variant = 'primary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  return <button className={`button ${variant} ${className}`} {...props}>{children}</button>
}

export function MetricCard({ label, value, icon, trend, tone = 'teal' }: { label: string; value: string; icon: ReactNode; trend?: string; tone?: 'teal' | 'blue' | 'amber' | 'rose' }) {
  return <article className="metric-card">
    <div className={`metric-icon ${tone}`}>{icon}</div>
    <div className="metric-data"><p>{label}</p><strong>{value}</strong>{trend && <span className={trend.startsWith('+') ? 'positive' : ''}>{trend}</span>}</div>
  </article>
}

export function StatusBadge({ status }: { status: InvoiceStatus | WarrantyStatus }) {
  const label = status === 'EXPIRING SOON' ? 'Expiring soon' : status.replace('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
  return <span className={`status ${status.toLowerCase().replaceAll('_', '-')}`}><i />{label}</span>
}

export function SearchInput({ value, onChange, placeholder = 'Search' }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="search-input"><Search size={17} /><input aria-label={placeholder} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} /></label>
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-illustration">⌁</div><h3>{title}</h3><p>{body}</p>{action}</div>
}

export function CopyId({ value }: { value: string }) {
  const copy = () => navigator.clipboard?.writeText(value)
  return <button type="button" className="copy-id" onClick={copy} title="Copy customer ID">{value}<Copy size={14} /></button>
}

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return <div className="modal-backdrop" role="presentation"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header><h2 id="modal-title">{title}</h2><button onClick={onClose} aria-label="Close dialog"><X size={19} /></button></header>{children}</section></div>
}

export function Select({ label, children, className = '' }: { label?: string; children: ReactNode; className?: string }) {
  return <label className={`select-wrap ${className}`}>{label && <span>{label}</span>}<select>{children}</select><ChevronDown size={15} /></label>
}

export function Step({ complete, active, number, children }: { complete?: boolean; active?: boolean; number: number; children: ReactNode }) {
  return <div className={`step ${complete ? 'complete' : ''} ${active ? 'active' : ''}`}><span>{complete ? <Check size={14} /> : number}</span><small>{children}</small></div>
}
