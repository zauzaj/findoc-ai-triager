# Clinic - Shadow Record Model
# =============================
# Minimal persistent layer for Google Places clinics
#
# Purpose:
#   - Preserve analytics continuity from day 1
#   - Enable future claim attachment
#   - Enable per-clinic performance metrics
#   - Enable monetization features (subscriptions)
#   - Avoid retroactive data stitching
#
# Source of Truth:
#   - clinic.place_id: Google Places canonical identifier
#   - All other clinic data: Google Places API (not stored here)
#
# This is NOT a clinic directory.
# It is an analytics and monetization overlay.

class Clinic < ApplicationRecord
  # Subscription status values
  SUBSCRIPTION_STATUSES = %w[none active expired].freeze

  # Claim status values
  CLAIM_STATUSES = %w[unclaimed claimed].freeze

  # Validations
  validates :place_id, presence: true, uniqueness: true
  validates :subscription_status, inclusion: { in: SUBSCRIPTION_STATUSES }
  validates :claim_status, inclusion: { in: CLAIM_STATUSES }
  validates :featured_enabled, inclusion: { in: [true, false] }
  validates :enhanced_profile_enabled, inclusion: { in: [true, false] }

  # Scopes for common queries
  scope :featured, -> { where(featured_enabled: true, subscription_status: 'active') }
  scope :claimed, -> { where(claim_status: 'claimed') }
  scope :active_subscription, -> { where(subscription_status: 'active') }

  # =============================
  # FINDER: Get or create shadow
  # =============================
  # Ensures idempotency: calling multiple times returns same record
  #
  # Usage:
  #   clinic = Clinic.find_or_create_shadow!(place_id: "ChIJ...")
  #
  # Returns the clinic record (created or existing)
  def self.find_or_create_shadow!(place_id:)
    find_or_create_by!(place_id: place_id) do |clinic|
      clinic.subscription_status = 'none'
      clinic.claim_status = 'unclaimed'
      clinic.featured_enabled = false
      clinic.enhanced_profile_enabled = false
    end
  end
end
