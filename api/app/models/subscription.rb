class Subscription < ApplicationRecord
  belongs_to :user
  belongs_to :plan

  STATUSES = %w[trialing active paused past_due cancelled expired].freeze

  validates :status, inclusion: { in: STATUSES }

  scope :active_or_trialing, -> { where(status: %w[active trialing]) }
  scope :cancelled,          -> { where(status: "cancelled") }
  scope :for_ls_id,          ->(id) { find_by(ls_subscription_id: id) }
  scope :recent,             -> { order(created_at: :desc) }

  # True while the user still has access (active or cancelled but within paid period)
  def access_active?
    return true if %w[active trialing].include?(status)
    return true if status == "cancelled" && expires_at&.future?
    false
  end

  def cancelling?
    status == "cancelled" && access_active?
  end

  # How many days since this subscription was created
  def age_days
    ((Time.current - created_at) / 86_400).round
  end

  # Day of the billing cycle when this subscription renews
  def renewal_day
    billing_day || current_period_start&.day
  end
end
