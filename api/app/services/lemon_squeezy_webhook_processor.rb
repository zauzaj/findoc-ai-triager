class LemonSqueezyWebhookProcessor
  IDEMPOTENCY_TTL = 48.hours

  def initialize(payload:, idempotency_key:)
    @payload = payload
    @idempotency_key = idempotency_key
  end

  def call
    unless mark_once
      Rails.logger.info "[webhook:ls] duplicate ignored key=#{idempotency_key}"
      return
    end

    event_name = payload.dig("meta", "event_name")
    user_id    = payload.dig("meta", "custom_data", "user_id")
    attrs      = payload.dig("data", "attributes") || {}
    ls_sub_id  = payload.dig("data", "id")

    Rails.logger.info "[webhook:ls] processing #{event_name} user_id=#{user_id} sub=#{ls_sub_id}"

    handle_subscription_event(
      event_name: event_name,
      attrs: attrs,
      ls_sub_id: ls_sub_id,
      user_id: user_id
    )
  end

  private

  attr_reader :payload, :idempotency_key

  def mark_once
    Rails.cache.write(idempotency_key, true, expires_in: IDEMPOTENCY_TTL, unless_exist: true)
  end

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

  def handle_created(user, attrs, ls_sub_id)
    was_lapsed = user&.plan == "free" && user&.subscriptions&.exists?
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
      cancelled_at: cancelled_at,
      expires_at: expires_at
    )
    record_analytics_event(
      event_name: "subscription_canceled",
      user: user, sub: sub,
      extra: { cancellation_day_of_cycle: sub.renewal_day }
    )
  end

  def handle_expired(user, attrs, ls_sub_id)
    sub = upsert_subscription(user, attrs, ls_sub_id, override_status: "expired")
    sync_user_plan(user, sub)
    record_analytics_event(event_name: "subscription_expired", user: user, sub: sub)
  end

  def handle_payment_failed(user, attrs, ls_sub_id)
    sub = upsert_subscription(user, attrs, ls_sub_id, override_status: "past_due")
    record_analytics_event(event_name: "subscription_payment_failed", user: user, sub: sub)
  end

  def upsert_subscription(user, attrs, ls_sub_id, override_status: nil, **extra_attrs)
    status = override_status || map_ls_status(attrs["status"])
    plan   = resolve_plan(status)

    sub = Subscription.find_or_initialize_by(ls_subscription_id: ls_sub_id)
    sub.assign_attributes(
      user: user,
      plan: plan,
      ls_customer_id: attrs["customer_id"]&.to_s,
      status: status,
      current_period_start: parse_time(attrs["current_period_start"]),
      current_period_end: parse_time(attrs["current_period_end"]),
      trial_ends_at: parse_time(attrs["trial_ends_at"]),
      billing_day: parse_time(attrs["current_period_start"])&.day,
      metadata: attrs,
      **extra_attrs
    )
    sub.save!
    sub
  end

  def sync_user_plan(user, sub)
    return unless user

    user.update!(plan: sub.plan.slug, current_plan_id: sub.plan_id)
    Rails.logger.info "[webhook:ls] user #{user.id} → plan=#{sub.plan.slug} status=#{sub.status}"
  end

  def map_ls_status(ls_status)
    case ls_status
    when "active"                then "active"
    when "trialing"              then "trialing"
    when "paused"                then "paused"
    when "cancelled"             then "cancelled"
    when "expired", "unpaid"     then "expired"
    when "past_due"              then "past_due"
    else                                "active"
    end
  end

  def resolve_plan(status)
    if %w[active trialing].include?(status)
      Plan.find_by(slug: "premium") || Plan.first
    else
      Plan.find_by(slug: "free") || Plan.first
    end
  end

  def parse_time(str)
    str ? Time.parse(str) : nil
  rescue ArgumentError
    nil
  end

  def record_analytics_event(event_name:, user:, sub:, extra: {})
    AnalyticsEvent.create!(
      event_name: event_name,
      user_id: user&.id,
      anonymous_id: nil,
      language: user&.locale || "en",
      properties: {
        plan_type: sub&.plan&.slug || "premium",
        subscription_age_days: sub&.age_days,
        ls_status: sub&.status,
        source: "webhook"
      }.merge(extra)
    )
  rescue StandardError => e
    Rails.logger.warn "[webhook:analytics] #{e.class}: #{e.message}"
  end
end
