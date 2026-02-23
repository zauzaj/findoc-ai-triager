if ENV["SENTRY_DSN"].present?
  Sentry.init do |config|
    config.dsn = ENV["SENTRY_DSN"]
    config.environment = Rails.env
    config.breadcrumbs_logger = [:active_support_logger, :http_logger]
    config.send_default_pii = false
    config.traces_sample_rate = ENV.fetch("SENTRY_TRACES_SAMPLE_RATE", "0.1").to_f
    config.enable_logs = true

    config.before_send = lambda do |event, _hint|
      event.tags ||= {}
      event.tags[:service] = "findoc-api"
      event
    end
  end
end
