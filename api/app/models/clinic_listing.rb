class ClinicListing < ApplicationRecord
  STATUSES = %w[unclaimed claimed_active claimed_expired].freeze

  belongs_to :claimed_by, class_name: "User", foreign_key: :claimed_by_id, optional: true

  validates :google_place_id, presence: true, uniqueness: true
  validates :status, inclusion: { in: STATUSES }
end
