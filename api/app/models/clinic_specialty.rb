class ClinicSpecialty < ApplicationRecord
  CONFIDENCE_LEVELS = %w[high medium low].freeze

  belongs_to :clinic, primary_key: :place_id, foreign_key: :place_id, inverse_of: :clinic_specialties

  validates :place_id, :specialty_slug, presence: true
  validates :specialty_slug, uniqueness: { scope: :place_id }
  validates :confidence, inclusion: { in: CONFIDENCE_LEVELS }
end
