# Receives Lemon Squeezy webhook events.
# This controller is intentionally outside the api/v1 namespace —
# it uses no JWT auth and must read the raw request body for HMAC verification.
class WebhooksController < ApplicationController
  # Skip JWT authenticate! (webhooks authenticate via HMAC signature instead)
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
    when "subscription_created", "subscription_updated", "subscription_resumed"
      return unless user
      status = attrs["status"]                              # "active", "trialing", "paused", etc.
      plan   = %w[active trialing].include?(status) ? "premium" : "free"
      user.update!(
        plan:                   plan,
        ls_subscription_id:     subscription_id,
        ls_subscription_status: status
      )
      Rails.logger.info "[webhook:ls] user #{user.id} → plan=#{plan} status=#{status}"

    when "subscription_cancelled"
      # Still active until period end; mark status so frontend can show "cancels soon"
      user&.update!(ls_subscription_status: "cancelled")

    when "subscription_expired", "subscription_paused"
      user&.update!(plan: "free", ls_subscription_status: attrs["status"] || event_name.split("_").last)
      Rails.logger.info "[webhook:ls] user #{user_id} downgraded → free"
    end
  end
end
