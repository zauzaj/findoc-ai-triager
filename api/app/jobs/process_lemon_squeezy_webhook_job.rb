class ProcessLemonSqueezyWebhookJob < ApplicationJob
  queue_as :default

  retry_on ActiveRecord::Deadlocked, ActiveRecord::ConnectionTimeoutError, wait: :exponentially_longer, attempts: 8
  retry_on Net::OpenTimeout, Net::ReadTimeout, Timeout::Error, wait: :exponentially_longer, attempts: 8

  def perform(payload, idempotency_key)
    processor = LemonSqueezyWebhookProcessor.new(payload: payload, idempotency_key: idempotency_key)
    processor.call
  end
end
