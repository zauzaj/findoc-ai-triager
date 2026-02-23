# Redis-backed request throttling for high-risk public API endpoints.
class RequestThrottle
  LIMITS = {
    "POST /api/v1/auth/magic_link" => 5,
    "POST /api/v1/navigate" => 30,
    "GET /api/v1/places/search" => 60,
    "POST /api/v1/tracking/*" => 120
  }.freeze

  WINDOW = 60
  ERROR_BODY = { error: "Too Many Requests", message: "Rate limit exceeded" }.freeze

  def initialize(app)
    @app = app
  end

  def call(env)
    request = Rack::Request.new(env)
    route_key = route_key_for(request)
    return @app.call(env) unless route_key

    anon_id = request.get_header("HTTP_X_ANONYMOUS_ID").presence || "ip:#{request.ip}"

    return throttled_response if throttled?(route_key, "ip", request.ip)
    return throttled_response if throttled?(route_key, "anonymous", anon_id)

    @app.call(env)
  end

  private

  def route_key_for(request)
    path = request.path

    return "POST /api/v1/auth/magic_link" if request.post? && path == "/api/v1/auth/magic_link"
    return "POST /api/v1/navigate" if request.post? && path == "/api/v1/navigate"
    return "GET /api/v1/places/search" if request.get? && path == "/api/v1/places/search"
    return "POST /api/v1/tracking/*" if request.post? && path.start_with?("/api/v1/tracking/")

    nil
  end

  def throttled?(route_key, dimension, subject)
    now_bucket = Time.now.to_i / WINDOW
    key = ["throttle", route_key, dimension, subject, now_bucket].join(":")

    count = redis.pipelined do |pipeline|
      pipeline.incr(key)
      pipeline.expire(key, WINDOW + 5)
    end.first

    count.to_i > LIMITS.fetch(route_key)
  rescue Redis::BaseError => e
    Rails.logger.error("[request_throttle] Redis unavailable: #{e.class}: #{e.message}")
    false
  end

  def redis
    @redis ||= Redis.new(url: ENV.fetch("REDIS_URL", "redis://localhost:6379/1"))
  end

  def throttled_response
    [429, { "Content-Type" => "application/json" }, [ERROR_BODY.to_json]]
  end
end

Rails.application.config.middleware.use RequestThrottle
