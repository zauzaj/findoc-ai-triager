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
    color: 'bg-status-medium-bg text-status-medium-text border-status-medium-border',
    description: 'Consider scheduling an appointment within the next few days.',
  },
  high: {
    label: 'High Priority',
    color: 'bg-status-high-bg text-status-high-text border-status-high-border',
    description: 'Please seek medical attention soon — within 24 hours if possible.',
  },
  emergency: {
    label: 'Emergency',
    color: 'bg-status-error-bg text-status-error-text border-emergency-red',
    description: 'Please go to the nearest emergency department or call 998 immediately.',
  },
} as const

export type UrgencyLevel = keyof typeof URGENCY_LEVELS

export const SITE_NAME = 'Findoc UAE'
export const SITE_URL = 'https://findoc.ae'
export const SITE_DESCRIPTION =
  'Independent health navigation platform for the UAE. Find the right specialist for your symptoms.'
