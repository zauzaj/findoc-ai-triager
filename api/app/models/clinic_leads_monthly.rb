class ClinicLeadsMonthly < ApplicationRecord
  validates :google_place_id, :year, :month, presence: true
  validates :google_place_id, uniqueness: { scope: %i[year month] }
end
