export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)

export const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${date}T12:00:00`))

import { parsePhoneNumberFromString } from 'libphonenumber-js/mobile'

/** Converts user input to a single E.164 identity. India is the default market. */
export const normalisePhone = (phone: string) => {
  const parsed = parsePhoneNumberFromString(phone, 'IN')
  return parsed?.isValid() ? parsed.number : ''
}

export const expiryStatus = (date: string, months: number) => {
  if (!months) return 'NO WARRANTY' as const
  const days = Math.ceil((new Date(`${date}T12:00:00`).getTime() - Date.now()) / 86_400_000)
  if (days < 0) return 'EXPIRED' as const
  if (days <= 30) return 'EXPIRING SOON' as const
  return 'ACTIVE' as const
}

export const daysRemaining = (date: string) => Math.ceil((new Date(`${date}T12:00:00`).getTime() - Date.now()) / 86_400_000)

export const addMonths = (date: string, months: number) => {
  const value = new Date(`${date}T12:00:00`)
  value.setMonth(value.getMonth() + months)
  value.setDate(value.getDate() - 1)
  return value.toISOString().slice(0, 10)
}

export const invoiceTotals = (items: { quantity: number; unitPrice: number; discount: number; gst: number }[]) => {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const discount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice * (item.discount / 100), 0)
  const taxable = subtotal - discount
  const tax = items.reduce((sum, item) => {
    const line = item.quantity * item.unitPrice * (1 - item.discount / 100)
    return sum + line * (item.gst / 100)
  }, 0)
  return { subtotal, discount, tax, total: Math.round(taxable + tax) }
}
