import type { Customer, Invoice, Notification, Shop } from '../types'

export const shop: Shop = {
  id: 'shop-aurora',
  name: 'Aurora Electronics',
  owner: 'Aarav Mehta',
  phone: '+91 98765 43120',
  email: 'hello@auroraelectronics.in',
  address: 'SCO 18, Sector 17, Chandigarh 160017',
  state: 'Chandigarh',
  gstin: '03AABCU9603R1ZM',
}

export const customers: Customer[] = [
  { id: 'cust-1', customerId: 'CUS-7F29A81D', name: 'Meet Sharma', phone: '+91 98765 43210', normalizedPhone: '+919876543210', email: 'meet.sharma@example.com', address: 'Sector 22, Chandigarh' },
  { id: 'cust-2', customerId: 'CUS-84B62F19', name: 'Priya Kapoor', phone: '+91 99887 12345', normalizedPhone: '+919988712345', email: 'priya.k@example.com', address: 'Sector 8, Chandigarh' },
  { id: 'cust-3', customerId: 'CUS-A71D93C4', name: 'Rohan Khanna', phone: '+91 98150 98765', normalizedPhone: '+919815098765', email: 'rohan.k@example.com', address: 'Mohali, Punjab' },
]

export const invoices: Invoice[] = [
  {
    id: 'inv-1', number: 'AUR-2026-0048', customerId: 'cust-1', shopId: 'shop-aurora', shopName: 'Aurora Electronics', date: '2026-08-09', status: 'PAID', paymentMethod: 'UPI', subtotal: 84990, discount: 5000, tax: 14398, total: 94388, amountPaid: 94388,
    items: [{ id: 'item-1', product: 'iPhone 17 Pro', brand: 'Apple', model: 'A3108', serial: 'F2LXK91Q7D', quantity: 1, unitPrice: 84990, discount: 5.88, gst: 18, warrantyMonths: 12, warrantyEnd: '2027-08-08' }],
  },
  {
    id: 'inv-2', number: 'AUR-2026-0047', customerId: 'cust-2', shopId: 'shop-aurora', shopName: 'Aurora Electronics', date: '2026-08-06', status: 'PAID', paymentMethod: 'Card', subtotal: 54990, discount: 0, tax: 9898, total: 64888, amountPaid: 64888,
    items: [{ id: 'item-2', product: 'Sony WH-1000XM6', brand: 'Sony', model: 'WH1000XM6/B', serial: 'S01-9035-XX', quantity: 1, unitPrice: 54990, discount: 0, gst: 18, warrantyMonths: 12, warrantyEnd: '2026-09-06' }],
  },
  {
    id: 'inv-3', number: 'AUR-2026-0046', customerId: 'cust-3', shopId: 'shop-aurora', shopName: 'Aurora Electronics', date: '2026-08-01', status: 'PARTIALLY_PAID', paymentMethod: 'Bank transfer', subtotal: 32000, discount: 2000, tax: 5400, total: 35400, amountPaid: 20000,
    items: [{ id: 'item-3', product: 'PlayStation 5 Slim', brand: 'Sony', model: 'CFI-2008', serial: 'A23BR58Z', quantity: 1, unitPrice: 32000, discount: 6.25, gst: 18, warrantyMonths: 24, warrantyEnd: '2028-07-31' }],
  },
  {
    id: 'inv-4', number: 'AUR-2026-0045', customerId: 'cust-1', shopId: 'shop-aurora', shopName: 'Aurora Electronics', date: '2026-07-22', status: 'PAID', paymentMethod: 'Cash', subtotal: 7990, discount: 0, tax: 1438, total: 9428, amountPaid: 9428,
    items: [{ id: 'item-4', product: 'AirPods Pro', brand: 'Apple', model: 'MTJV3HN/A', serial: 'GX8Z71P2', quantity: 1, unitPrice: 7990, discount: 0, gst: 18, warrantyMonths: 12, warrantyEnd: '2026-08-18' }],
  },
]

export const notifications: Notification[] = [
  { id: 'notice-1', title: 'Warranty expiry approaching', description: 'Your AirPods Pro warranty ends in 7 days.', date: 'Today', read: false, type: 'warranty' },
  { id: 'notice-2', title: 'Invoice is ready', description: 'AUR-2026-0048 is available in your purchase history.', date: '2 days ago', read: false, type: 'invoice' },
  { id: 'notice-3', title: 'Invoice uploaded', description: 'Your online purchase was saved successfully.', date: '4 days ago', read: true, type: 'upload' },
]
