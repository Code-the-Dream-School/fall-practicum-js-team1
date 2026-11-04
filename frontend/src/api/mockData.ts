import mockData from './mockData.json' with { type: 'json' }

import type Claim from '../types/claim'
import type Item from '../types/item'
import type User from '../types/user'

const USERS = mockData.users

let claimIndex = 0
const PENDING_CLAIMS = makeClaims('pending')
const PICKED_UP_CLAIMS = makeClaims('picked_up')

const ADDRESSES = mockData.addresses.map((addr, i) => {
  return {
    ...addr,
    user: USERS[i]
  }
})

function makeClaims(claimStatus: string): Claim[] {
  const itemStatus: string | undefined = {
    pending: 'reserved',
    picked_up: 'picked_up',
  }[claimStatus]

  let decidedAt: Date | null;
  let pickedUpAt: Date | null;

  if (claimStatus === 'picked_up') {
    decidedAt = new Date()
    pickedUpAt = new Date()
  }

  return mockData.items
    .filter((item) => item.status === itemStatus)
    .map((item) => {
      return {
        id: ++claimIndex,
        claimer: mockData.users[0],
        message: `message for claim ${claimIndex}`,
        createdAt: new Date,
        decidedAt,
        pickedUpAt,
        status,
        item
      }
    })
}

export function getClaims(status: string | null): Claim[] {
  if (status === 'pending') {
    return PENDING_CLAIMS
  } else if (status === 'picked_up') {
    return PICKED_UP_CLAIMS
  } else {
    return PENDING_CLAIMS.concat(PICKED_UP_CLAIMS)
  }
}

export function getUser(): User {
  return mockData.users[0]
}

export function getItems(): Item[] {
  return mockData.items
}
