import { normalisePhone } from './format'
import type { Customer } from '../types'

export interface CustomerIdentityRepository {
  findByNormalizedPhone(phone: string): Promise<Customer | null>
  create(customer: Customer): Promise<Customer>
}

export class CustomerIdentityError extends Error {}

/**
 * The server-side identity operation. In a real repository, `create` runs in a
 * transaction with UNIQUE(normalized_phone) and UNIQUE(customer_id). If a second
 * request wins the race, find the customer that just committed and reuse it.
 */
export async function ensureCustomer(
  repository: CustomerIdentityRepository,
  input: Pick<Customer, 'name' | 'phone' | 'email' | 'address'>,
  makeId: () => string = generateCustomerId,
): Promise<Customer> {
  const normalizedPhone = normalisePhone(input.phone)
  if (!normalizedPhone) throw new CustomerIdentityError('Enter a valid phone number with country code or a valid Indian mobile number.')
  const current = await repository.findByNormalizedPhone(normalizedPhone)
  if (current) return current
  const candidate: Customer = {
    id: crypto.randomUUID(),
    customerId: makeId(),
    name: input.name.trim(),
    phone: normalizedPhone,
    normalizedPhone,
    email: input.email?.trim() || undefined,
    address: input.address?.trim() || undefined,
  }
  try {
    return await repository.create(candidate)
  } catch (error) {
    // PostgreSQL unique_violation (23505) is an expected concurrent create race.
    const createdByOtherRequest = await repository.findByNormalizedPhone(normalizedPhone)
    if (createdByOtherRequest) return createdByOtherRequest
    throw error
  }
}

export function generateCustomerId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(4))
  return `CUS-${[...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase()}`
}
