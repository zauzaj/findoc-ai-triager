require "json"
require "socket"

module Observability
  module_function

  DEFAULT_TAGS = {
    service: "findoc-api",
    env: Rails.env
  }.freeze

  def log_event(event:, level: :info, **fields)
    payload = DEFAULT_TAGS.merge(event: event, timestamp: Time.current.iso8601).merge(fields.compact)
    Rails.logger.public_send(level, payload.to_json)
  rescue => e
    Rails.logger.warn({ event: "observability.log_event_error", error_class: e.class.name, error_message: e.message }.to_json)
  end

  def increment(metric, value: 1, tags: {})
    emit_statsd("#{metric}:#{value}|c", tags)
  end

  def timing(metric, value_ms, tags: {})
    emit_statsd("#{metric}:#{value_ms.round(1)}|ms", tags)
  end

  def measure(metric, tags: {})
    started_at = Process.clock_gettime(Process::CLOCK_MONOTONIC)
    result = yield
    elapsed_ms = (Process.clock_gettime(Process::CLOCK_MONOTONIC) - started_at) * 1000.0
    timing(metric, elapsed_ms, tags: tags)
    result
  end

  def capture_exception(exception, context: {})
    Sentry.capture_exception(exception, extra: context) if defined?(Sentry)
  rescue => e
    Rails.logger.warn({ event: "observability.capture_exception_error", error_class: e.class.name, error_message: e.message }.to_json)
  end

  def emit_statsd(stat, tags)
    host = ENV["STATSD_HOST"]
    port = ENV.fetch("STATSD_PORT", "8125").to_i
    return if host.blank?

    tag_string = format_tags(tags)
    packet = "#{stat}#{tag_string}"

    socket = UDPSocket.new
    socket.send(packet, 0, host, port)
    socket.close
  rescue => e
    Rails.logger.warn({ event: "observability.statsd_emit_error", error_class: e.class.name, error_message: e.message }.to_json)
  end

  def format_tags(tags)
    merged = DEFAULT_TAGS.merge(tags || {}).compact
    return "" if merged.empty?

    "|##{merged.map { |k, v| "#{k}:#{sanitize_tag(v)}" }.join(",")}"
  end

  def sanitize_tag(value)
    value.to_s.gsub(/[^a-zA-Z0-9_\-.]/, "_")
  end
end
