class ClinicInsuranceLink < ApplicationRecord
  REPORTERS = %w[clinic user google].freeze
  SOURCES = %w[scraped manual verified].freeze
  CONFIDENCE_LEVELS = %w[low medium high].freeze

  belongs_to :insurance_provider

  validates :google_place_id, :insurance_slug, presence: true
  validates :reported_by, inclusion: { in: REPORTERS }
  validates :source, inclusion: { in: SOURCES }
  validates :confidence, inclusion: { in: CONFIDENCE_LEVELS }
  validates :google_place_id, uniqueness: { scope: :insurance_provider_id }

  before_validation :default_insurance_slug

  private

  def default_insurance_slug
    self.insurance_slug = insurance_provider&.slug if insurance_slug.blank?
  end
end
