class AnalyticsEvent < ApplicationRecord
  validates :event_name, presence: true

  scope :by_event,  ->(name) { where(event_name: name) }
  scope :for_user,  ->(uid)  { where(user_id: uid) }
  scope :anonymous, ->       { where(user_id: nil) }
  scope :recent,    ->       { order(created_at: :desc) }
end
