class LeadEvent < ApplicationRecord
  EVENT_TYPES = %w[view phone_click directions_click website_click whatsapp_share].freeze

  belongs_to :navigation_session, optional: true
  belongs_to :user,               optional: true

  validates :google_place_id, :event_type, presence: true
  validates :event_type, inclusion: { in: EVENT_TYPES }

  scope :phone_clicks,  -> { where(event_type: "phone_click") }
  scope :for_place,     ->(id) { where(google_place_id: id) }
end
