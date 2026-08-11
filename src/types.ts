export type Role = 'shopkeeper' | 'customer'
export type InvoiceStatus = 'PAID' | 'PARTIALLY_PAID' | 'DRAFT' | 'CANCELLED'
export type WarrantyStatus = 'ACTIVE' | 'EXPIRING SOON' | 'EXPIRED' | 'NO WARRANTY'

export interface Customer {
  id: string
  customerId: string
  name: string
  phone: string
  normalizedPhone: string
  email?: string
  address?: string
}

export interface InvoiceItem {
  id: string
  product: string
  brand: string
  model: string
  serial: string
  quantity: number
  unitPrice: number
  discount: number
  gst: number
  warrantyMonths: number
  warrantyEnd: string
}

export interface Invoice {
  id: string
  number: string
  customerId: string
  shopId: string
  shopName: string
  date: string
  dueDate?: string
  status: InvoiceStatus
  paymentMethod: string
  items: InvoiceItem[]
  subtotal: number
  discount: number
  tax: number
  total: number
  amountPaid: number
}

export interface Notification {
  id: string
  title: string
  description: string
  date: string
  read: boolean
  type: 'warranty' | 'invoice' | 'upload'
}

export interface Shop {
  id: string
  name: string
  owner: string
  phone: string
  email: string
  address: string
  state: string
  gstin: string
}
