export const INSURERS = [
  'Daman',
  'AXA',
  'Oman Insurance',
  'Cigna',
  'MetLife',
  'Allianz',
  'Bupa',
] as const

export type Insurer = (typeof INSURERS)[number]

export const URGENCY_LEVELS = {
  low: {
    label: 'Low Priority',
    color: 'bg-soft-green text-primary-green border-primary-green',
    description: 'Your symptoms can be addressed at your next convenient appointment.',
  },
  medium: {
    label: 'Moderate Priority',
    color: 'bg-yellow-50 text-yellow-800 border-yellow-400',
    description: 'Consider scheduling an appointment within the next few days.',
  },
  high: {
    label: 'High Priority',
    color: 'bg-amber-50 text-amber-800 border-warning-amber',
    description: 'Please seek medical attention soon — within 24 hours if possible.',
  },
  emergency: {
    label: 'Emergency',
    color: 'bg-red-50 text-red-700 border-emergency-red',
    description: 'Please go to the nearest emergency department or call 998 immediately.',
  },
} as const

export type UrgencyLevel = keyof typeof URGENCY_LEVELS

export const SITE_NAME = 'Findoc UAE'
export const SITE_URL = 'https://findoc.ae'
export const SITE_DESCRIPTION =
  'Independent health navigation platform for the UAE. Find the right specialist for your symptoms.'
