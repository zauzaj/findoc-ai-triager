class NavigationSession < ApplicationRecord
  STATUSES       = %w[active completed abandoned].freeze
  URGENCY_LEVELS = %w[low medium high emergency].freeze

  belongs_to :user, optional: true
  has_many   :lead_events

  validates :session_token, presence: true, uniqueness: true
  validates :status,        inclusion: { in: STATUSES }

  before_validation :set_session_token, on: :create

  scope :completed, -> { where(status: "completed") }
  scope :recent,    -> { order(created_at: :desc) }

  private

  def set_session_token
    self.session_token ||= SecureRandom.urlsafe_base64(24)
  end
end
