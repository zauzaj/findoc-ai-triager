class User < ApplicationRecord
  PLANS     = %w[free premium].freeze
  LOCALES   = %w[en ar].freeze
  PROVIDERS = %w[google apple email].freeze

  validates :email,    presence: true, uniqueness: true
  validates :plan,     inclusion: { in: PLANS }
  validates :locale,   inclusion: { in: LOCALES }
  validates :provider, inclusion: { in: PROVIDERS }

  has_many :navigation_sessions
  has_many :lead_events
  has_many :saved_places

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

  def navigation_limit_reached?
    plan == "free" && navigations_this_month >= 10
  end
end
