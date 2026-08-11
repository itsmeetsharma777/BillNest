import { describe, expect, it } from 'vitest'
import { addMonths, invoiceTotals } from './format'

describe('invoice calculations', () => {
  it('calculates line discounts and GST without trusting a client total', () => {
    expect(invoiceTotals([{ quantity: 2, unitPrice: 1000, discount: 10, gst: 18 }])).toEqual({ subtotal: 2000, discount: 200, tax: 324, total: 2124 })
  })

  it('uses a consistent exclusive-end date for warranty coverage', () => {
    expect(addMonths('2026-08-11', 12)).toBe('2027-08-10')
  })
})
