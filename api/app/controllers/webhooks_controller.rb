require "digest"

# Receives Lemon Squeezy webhook events.
# Intentionally outside the api/v1 namespace — no JWT auth, HMAC-verified.
class WebhooksController < ApplicationController
  before_action :verify_lemon_squeezy_signature

  # POST /webhooks/lemon_squeezy
  def lemon_squeezy
    payload = JSON.parse(request.raw_post)
    event_name = payload.dig("meta", "event_name")
    ls_sub_id  = payload.dig("data", "id")
    idempotency_key = webhook_idempotency_key(payload)

    Rails.logger.info "[webhook:ls] queued #{event_name} sub=#{ls_sub_id} key=#{idempotency_key}"
    ProcessLemonSqueezyWebhookJob.perform_later(payload, idempotency_key)

    render json: { received: true, enqueued: true }, status: :accepted
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

  def webhook_idempotency_key(payload)
    event_id = payload.dig("meta", "webhook_id") || payload.dig("meta", "event_id")
    return "ls:webhook:event:#{event_id}" if event_id.present?

    digest = Digest::SHA256.hexdigest(request.raw_post)
    "ls:webhook:body:#{digest}"
  end
end
