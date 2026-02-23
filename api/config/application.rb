require_relative "boot"
require "rails/all"

Bundler.require(*Rails.groups)

module Api
  class Application < Rails::Application
    config.load_defaults 7.2
    config.api_only = true
    config.cache_store = :redis_cache_store, {
      url: ENV.fetch("REDIS_URL", "redis://localhost:6379/1"),
      expires_in: 12.hours
    }
    config.time_zone = "Asia/Dubai"
    config.autoload_paths += %W[#{config.root}/app/services]
  end
end
