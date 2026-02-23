# Receives Lemon Squeezy webhook events.
# Intentionally outside the api/v1 namespace — no JWT auth, HMAC-verified.
#
# Subscription lifecycle model:
#   - Each webhook upserts a Subscription record (ls_subscription_id is the key)
#   - The user's denormalized `plan` string column is kept in sync for fast reads
#   - The user's `current_plan_id` FK is updated to the correct Plan record
#   - All state changes generate an AnalyticsEvent for the revenue dashboard
class WebhooksController < ApplicationController
  before_action :verify_lemon_squeezy_signature

  # POST /webhooks/lemon_squeezy
  def lemon_squeezy
    payload    = JSON.parse(request.raw_post)
    event_name = payload.dig("meta", "event_name")
    user_id    = payload.dig("meta", "custom_data", "user_id")
    attrs      = payload.dig("data", "attributes") || {}
    ls_sub_id  = payload.dig("data", "id")

    Rails.logger.info "[webhook:ls] #{event_name} user_id=#{user_id} sub=#{ls_sub_id}"

    handle_subscription_event(
      event_name: event_name,
      attrs:      attrs,
      ls_sub_id:  ls_sub_id,
      user_id:    user_id
    )

    Observability.log_event(event: "billing_webhook.processed", provider: "lemon_squeezy", event_name: event_name, result: "success", user_id: user_id, subscription_id: ls_sub_id)
    Observability.increment("billing.webhook.processed", tags: { result: "success", event_name: event_name })
    render json: { received: true }
  rescue JSON::ParserError => e
    Observability.log_event(event: "billing_webhook.processed", level: :warn, provider: "lemon_squeezy", result: "invalid_json", error_message: e.message)
    Observability.increment("billing.webhook.processed", tags: { result: "invalid_json" })
    render json: { error: "Invalid JSON" }, status: :bad_request
  rescue => e
    Observability.log_event(event: "billing_webhook.processed", level: :error, provider: "lemon_squeezy", event_name: event_name, result: "failure", error_class: e.class.name, error_message: e.message)
    Observability.increment("billing.webhook.processed", tags: { result: "failure", event_name: event_name })
    Observability.capture_exception(e, context: { controller: "webhooks", event_name: event_name })
    render json: { error: "Webhook processing failed" }, status: :internal_server_error
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

  # ── Event routing ──────────────────────────────────────────────────────────

  def handle_subscription_event(event_name:, attrs:, ls_sub_id:, user_id:)
    user = User.find_by(id: user_id)

    case event_name
    when "subscription_created"
      handle_created(user, attrs, ls_sub_id)
    when "subscription_updated", "subscription_resumed"
      handle_updated(user, attrs, ls_sub_id, event_name)
    when "subscription_cancelled"
      handle_cancelled(user, attrs, ls_sub_id)
    when "subscription_expired", "subscription_paused"
      handle_expired(user, attrs, ls_sub_id)
    when "subscription_payment_failed"
      handle_payment_failed(user, attrs, ls_sub_id)
    end
  end

  # ── Handlers ───────────────────────────────────────────────────────────────

  def handle_created(user, attrs, ls_sub_id)
    was_lapsed = user&.plan == "free" && user&.subscriptions.exists?
    sub = upsert_subscription(user, attrs, ls_sub_id)
    sync_user_plan(user, sub)
    record_analytics_event(
      event_name: was_lapsed ? "subscription_reactivated" : "subscription_activated",
      user: user, sub: sub
    )
  end

  def handle_updated(user, attrs, ls_sub_id, event_name)
    sub = upsert_subscription(user, attrs, ls_sub_id)
    sync_user_plan(user, sub)
    record_analytics_event(
      event_name: event_name == "subscription_resumed" ? "subscription_reactivated" : "subscription_renewed",
      user: user, sub: sub
    )
  end

  def handle_cancelled(user, attrs, ls_sub_id)
    cancelled_at = Time.current
    expires_at   = attrs["ends_at"] ? Time.parse(attrs["ends_at"]) : nil
    sub = upsert_subscription(user, attrs, ls_sub_id,
      override_status: "cancelled",
      cancelled_at:    cancelled_at,
      expires_at:      expires_at
    )
    # User keeps premium access until expires_at — do NOT downgrade plan yet
    record_analytics_event(
      event_name: "subscription_canceled",
      user: user, sub: sub,
      extra: { cancellation_day_of_cycle: sub.renewal_day }
    )
  end

  def handle_expired(user, attrs, ls_sub_id)
    sub = upsert_subscription(user, attrs, ls_sub_id, override_status: "expired")
    sync_user_plan(user, sub)   # downgrades user to free
    record_analytics_event(event_name: "subscription_expired", user: user, sub: sub)
  end

  def handle_payment_failed(user, attrs, ls_sub_id)
    sub = upsert_subscription(user, attrs, ls_sub_id, override_status: "past_due")
    record_analytics_event(event_name: "subscription_payment_failed", user: user, sub: sub)
  end

  # ── Subscription upsert ────────────────────────────────────────────────────

  def upsert_subscription(user, attrs, ls_sub_id, override_status: nil, **extra_attrs)
    status = override_status || map_ls_status(attrs["status"])
    plan   = resolve_plan(status)

    sub = Subscription.find_or_initialize_by(ls_subscription_id: ls_sub_id)
    sub.assign_attributes(
      user:                 user,
      plan:                 plan,
      ls_customer_id:       attrs["customer_id"]&.to_s,
      status:               status,
      current_period_start: parse_time(attrs["current_period_start"]),
      current_period_end:   parse_time(attrs["current_period_end"]),
      trial_ends_at:        parse_time(attrs["trial_ends_at"]),
      billing_day:          parse_time(attrs["current_period_start"])&.day,
      metadata:             attrs,
      **extra_attrs
    )
    sub.save!
    sub
  end

  # Keeps the user's denormalized `plan` string and `current_plan_id` FK in sync.
  def sync_user_plan(user, sub)
    return unless user
    user.update!(plan: sub.plan.slug, current_plan_id: sub.plan_id)
    Rails.logger.info "[webhook:ls] user #{user.id} → plan=#{sub.plan.slug} status=#{sub.status}"
  end

  # ── Helpers ────────────────────────────────────────────────────────────────

  def map_ls_status(ls_status)
    case ls_status
    when "active"                then "active"
    when "trialing"              then "trialing"
    when "paused"                then "paused"
    when "cancelled"             then "cancelled"
    when "expired", "unpaid"     then "expired"
    when "past_due"              then "past_due"
    else                              "active"
    end
  end

  def resolve_plan(status)
    if %w[active trialing].include?(status)
      Plan.find_by(slug: "premium") || Plan.first
    else
      Plan.find_by(slug: "free")    || Plan.first
    end
  end

  def parse_time(str)
    str ? Time.parse(str) : nil
  rescue ArgumentError
    nil
  end

  # ── Analytics ──────────────────────────────────────────────────────────────

  def record_analytics_event(event_name:, user:, sub:, extra: {})
    AnalyticsEvent.create!(
      event_name:   event_name,
      user_id:      user&.id,
      anonymous_id: nil,
      language:     user&.locale || "en",
      properties:   {
        plan_type:             sub&.plan&.slug || "premium",
        subscription_age_days: sub&.age_days,
        ls_status:             sub&.status,
        source:                "webhook",
      }.merge(extra)
    )
  rescue => e
    Rails.logger.warn "[webhook:analytics] #{e.class}: #{e.message}"
  end
end
