class InsuranceProvider < ApplicationRecord
  validates :name, :slug, presence: true
  validates :slug, uniqueness: true

  has_many :clinic_insurance_links
end
