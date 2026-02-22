# Receives Lemon Squeezy webhook events.
# Intentionally outside the api/v1 namespace — no JWT auth, HMAC-verified.
class WebhooksController < ApplicationController
  before_action :verify_lemon_squeezy_signature

  # POST /webhooks/lemon_squeezy
  def lemon_squeezy
    payload    = JSON.parse(request.raw_post)
    event_name = payload.dig("meta", "event_name")
    user_id    = payload.dig("meta", "custom_data", "user_id")

    Rails.logger.info "[webhook:ls] #{event_name} user_id=#{user_id}"

    handle_subscription_event(
      event_name:      event_name,
      attrs:           payload.dig("data", "attributes") || {},
      subscription_id: payload.dig("data", "id"),
      user_id:         user_id
    )

    render json: { received: true }
  rescue JSON::ParserError
    render json: { error: "Invalid JSON" }, status: :bad_request
  end

  private

  def verify_lemon_squeezy_signature
    raw_body  = request.raw_post
    signature = request.headers["X-Signature"]

    LemonsqueezyService.verify_webhook!(raw_body, signature)
  rescue KeyError
    render json: { error: "Webhook secret not configured" }, status: :service_unavailable
  rescue ArgumentError => e
    Rails.logger.warn "[webhook:ls] Rejected — #{e.message}"
    render json: { error: "Invalid signature" }, status: :unauthorized
  end

  def handle_subscription_event(event_name:, attrs:, subscription_id:, user_id:)
    user = User.find_by(id: user_id)

    case event_name
    when "subscription_created"
      return unless user
      status = attrs["status"]
      plan   = %w[active trialing].include?(status) ? "premium" : "free"
      was_premium_before = user.premium?
      user.update!(plan: plan, ls_subscription_id: subscription_id, ls_subscription_status: status)
      record_analytics_event(
        event_name:  was_premium_before ? "subscription_reactivated" : "subscription_activated",
        user:        user,
        properties:  subscription_properties(user, attrs)
      )

    when "subscription_updated", "subscription_resumed"
      return unless user
      status = attrs["status"]
      plan   = %w[active trialing].include?(status) ? "premium" : "free"
      user.update!(plan: plan, ls_subscription_id: subscription_id, ls_subscription_status: status)
      record_analytics_event(
        event_name:  event_name == "subscription_resumed" ? "subscription_reactivated" : "subscription_renewed",
        user:        user,
        properties:  subscription_properties(user, attrs)
      )

    when "subscription_cancelled"
      user&.update!(ls_subscription_status: "cancelled")
      record_analytics_event(
        event_name: "subscription_canceled",
        user:       user,
        properties: subscription_properties(user, attrs).merge(
          cancellation_day_of_cycle: attrs["billing_anchor"]
        )
      )

    when "subscription_expired", "subscription_paused"
      user&.update!(plan: "free", ls_subscription_status: attrs["status"] || event_name.split("_").last)
      record_analytics_event(
        event_name: "subscription_expired",
        user:       user,
        properties: subscription_properties(user, attrs)
      )

    when "subscription_payment_failed"
      record_analytics_event(
        event_name: "subscription_payment_failed",
        user:       user,
        properties: subscription_properties(user, attrs)
      )
    end

    Rails.logger.info "[webhook:ls] user #{user_id} → plan=#{user&.plan} status=#{user&.ls_subscription_status}"
  end

  # ── Analytics helpers ──────────────────────────────────────────────────────

  def subscription_properties(user, attrs)
    created_at = attrs["created_at"]&.then { |d| Time.parse(d) rescue nil }
    age_days   = created_at ? ((Time.current - created_at) / 86_400).round : nil
    {
      plan_type:            "premium",
      subscription_age_days: age_days,
      ls_status:            attrs["status"],
    }
  end

  def record_analytics_event(event_name:, user:, properties: {})
    AnalyticsEvent.create!(
      event_name:   event_name,
      user_id:      user&.id,
      anonymous_id: nil,
      language:     user&.locale || "en",
      properties:   properties.merge(source: "webhook")
    )
  rescue => e
    Rails.logger.warn "[webhook:analytics] #{e.class}: #{e.message}"
  end
end
