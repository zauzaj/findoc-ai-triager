class ClinicInsuranceLink < ApplicationRecord
  REPORTERS = %w[clinic user google].freeze

  belongs_to :insurance_provider

  validates :google_place_id, presence: true
  validates :reported_by, inclusion: { in: REPORTERS }
  validates :google_place_id, uniqueness: { scope: :insurance_provider_id }
end
