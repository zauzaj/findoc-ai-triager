class User < ApplicationRecord
  has_secure_password validations: false

  PLANS     = %w[free premium].freeze
  LOCALES   = %w[en ar].freeze
  PROVIDERS = %w[google apple email].freeze

  validates :email,    presence: true, uniqueness: true
  validates :plan,     inclusion: { in: PLANS }
  validates :locale,   inclusion: { in: LOCALES }
  validates :provider, inclusion: { in: PROVIDERS }

  belongs_to :current_plan, class_name: "Plan", optional: true

  has_many :subscriptions
  has_many :navigation_sessions
  has_many :lead_events
  has_many :saved_places

  FREE_NAV_LIMIT = 3

  def self.from_google(payload)
    uid = payload["sub"]
    find_or_initialize_by(provider: "google", provider_uid: uid).tap do |u|
      u.email      = payload["email"]
      u.name       = payload["name"]
      u.avatar_url = payload["picture"]
      u.save!
    end
  end

  def generate_magic_link_token!
    token = SecureRandom.urlsafe_base64(32)
    update!(magic_link_token: token, magic_link_expires_at: 1.hour.from_now)
    token
  end

  def magic_link_valid?(token)
    magic_link_token == token && magic_link_expires_at&.future?
  end

  def consume_magic_link!
    update!(magic_link_token: nil, magic_link_expires_at: nil)
  end

  def premium?
    plan == "premium"
  end

  # The server never blocks navigation — enforcement is UI-only.
  def navigation_limit_reached?
    plan == "free" && navigations_this_month >= FREE_NAV_LIMIT
  end

  # Returns the most recent subscription record, regardless of status.
  def latest_subscription
    subscriptions.recent.first
  end

  # Returns the active or trialing subscription, if any.
  def active_subscription
    subscriptions.active_or_trialing.recent.first
  end

  # True while subscription is paid and access has not expired.
  def subscription_active?
    active_subscription.present?
  end

  # True when user cancelled but is still within the paid period.
  def subscription_cancelling?
    latest_subscription&.cancelling?
  end

  # Derived subscription status for API responses (mirrors the latest sub record).
  def ls_subscription_status
    latest_subscription&.status
  end
end
