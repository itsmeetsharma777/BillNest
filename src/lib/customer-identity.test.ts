import { describe, expect, it } from 'vitest'
import { ensureCustomer } from './customer-identity'
import type { Customer } from '../types'

class MemoryCustomers {
  records: Customer[] = []
  async findByNormalizedPhone(phone: string) { return this.records.find(record => record.normalizedPhone === phone) ?? null }
  async create(customer: Customer) {
    if (this.records.some(record => record.normalizedPhone === customer.normalizedPhone)) throw new Error('23505 unique_violation')
    this.records.push(customer)
    return customer
  }
}

describe('global customer identity', () => {
  it('normalizes common Indian formats to one permanent customer', async () => {
    const repository = new MemoryCustomers()
    const first = await ensureCustomer(repository, { name: 'Meet Sharma', phone: '9876543210' }, () => 'CUS-7F29A81D')
    const second = await ensureCustomer(repository, { name: 'Different supplied name', phone: '+91 98765 43210' }, () => 'CUS-SHOULDNOT')
    expect(first.customerId).toBe('CUS-7F29A81D')
    expect(second.customerId).toBe('CUS-7F29A81D')
    expect(repository.records).toHaveLength(1)
    expect(first.normalizedPhone).toBe('+919876543210')
  })

  it('returns the customer committed by a concurrent request', async () => {
    const repository = new MemoryCustomers()
    const winning = await ensureCustomer(repository, { name: 'Priya', phone: '9988712345' }, () => 'CUS-WINNER01')
    const duplicate = await ensureCustomer(repository, { name: 'Priya K.', phone: '91-9988712345' }, () => 'CUS-LOSER001')
    expect(duplicate).toEqual(winning)
  })
})
