class Clinic < ApplicationRecord
  self.table_name = "clinics"

  SUBSCRIPTION_STATUSES = %w[none active canceled expired].freeze
  CLAIM_STATUSES = %w[unclaimed pending claimed rejected].freeze

  belongs_to :claimed_by_user, class_name: "User", optional: true

  has_many :clinic_specialties, primary_key: :place_id, foreign_key: :place_id, inverse_of: :clinic, dependent: :delete_all

  validates :place_id, presence: true, uniqueness: true
  validates :subscription_status, inclusion: { in: SUBSCRIPTION_STATUSES }
  validates :claim_status, inclusion: { in: CLAIM_STATUSES }
end
