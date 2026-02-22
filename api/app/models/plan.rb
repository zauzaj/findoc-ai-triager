class Plan < ApplicationRecord
  has_many :subscriptions
  has_many :users, foreign_key: :current_plan_id

  validates :slug,           presence: true, uniqueness: true
  validates :name,           presence: true
  validates :price_aed_cents, numericality: { greater_than_or_equal_to: 0 }

  scope :active, -> { where(active: true) }

  FREE_SLUG    = "free"
  PREMIUM_SLUG = "premium"

  def self.free
    find_by!(slug: FREE_SLUG)
  end

  def self.premium
    find_by!(slug: PREMIUM_SLUG)
  end

  # AED amount as a decimal (e.g. 18.99)
  def price_aed
    price_aed_cents / 100.0
  end

  def free?
    slug == FREE_SLUG
  end

  def unlimited_navigations?
    nav_limit_monthly == 0
  end

  def unlimited_results?
    result_limit == 0
  end
end
