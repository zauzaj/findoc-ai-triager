class SavedPlace < ApplicationRecord
  belongs_to :user

  validates :google_place_id, presence: true
  validates :google_place_id, uniqueness: { scope: :user_id }
end
