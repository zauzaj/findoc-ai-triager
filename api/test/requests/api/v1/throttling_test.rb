require "test_helper"

class Api::V1::ThrottlingTest < ActionDispatch::IntegrationTest
  setup do
    clear_throttle_keys
  end

  test "allows initial request for magic_link" do
    post "/api/v1/auth/magic_link", params: {}, headers: default_headers
    assert_not_equal 429, response.status
  end

  test "throttles magic_link by anonymous id" do
    limit = RequestThrottle::LIMITS.fetch("POST /api/v1/auth/magic_link")

    limit.times do |i|
      post "/api/v1/auth/magic_link", params: {}, headers: default_headers.merge("REMOTE_ADDR" => "10.0.0.#{i}")
    end

    post "/api/v1/auth/magic_link", params: {}, headers: default_headers.merge("REMOTE_ADDR" => "10.0.1.1")
    assert_response :too_many_requests
    assert_equal({ "error" => "Too Many Requests", "message" => "Rate limit exceeded" }, JSON.parse(response.body))
  end

  test "allows initial request for navigate" do
    post "/api/v1/navigate", params: {}, headers: default_headers
    assert_not_equal 429, response.status
  end

  test "throttles navigate by ip" do
    limit = RequestThrottle::LIMITS.fetch("POST /api/v1/navigate")

    limit.times do |i|
      post "/api/v1/navigate", params: {}, headers: default_headers.merge("X-Anonymous-Id" => "anon-#{i}")
    end

    post "/api/v1/navigate", params: {}, headers: default_headers.merge("X-Anonymous-Id" => "anon-next")
    assert_response :too_many_requests
  end

  test "allows initial request for places search" do
    get "/api/v1/places/search", params: {}, headers: default_headers
    assert_not_equal 429, response.status
  end

  test "throttles places search by anonymous id" do
    limit = RequestThrottle::LIMITS.fetch("GET /api/v1/places/search")

    limit.times do |i|
      get "/api/v1/places/search", params: {}, headers: default_headers.merge("REMOTE_ADDR" => "10.0.2.#{i}")
    end

    get "/api/v1/places/search", params: {}, headers: default_headers.merge("REMOTE_ADDR" => "10.0.3.1")
    assert_response :too_many_requests
  end

  test "allows initial request for tracking" do
    post "/api/v1/tracking/view", params: {}, headers: default_headers
    assert_not_equal 429, response.status
  end

  test "throttles tracking by ip" do
    limit = RequestThrottle::LIMITS.fetch("POST /api/v1/tracking/*")

    limit.times do |i|
      post "/api/v1/tracking/view", params: {}, headers: default_headers.merge("X-Anonymous-Id" => "tracking-#{i}")
    end

    post "/api/v1/tracking/view", params: {}, headers: default_headers.merge("X-Anonymous-Id" => "tracking-next")
    assert_response :too_many_requests
  end

  private

  def default_headers
    { "X-Anonymous-Id" => "anon-shared" }
  end

  def clear_throttle_keys
    redis = Redis.new(url: ENV.fetch("REDIS_URL", "redis://localhost:6379/1"))
    cursor = "0"

    loop do
      cursor, keys = redis.scan(cursor, match: "throttle:*", count: 100)
      redis.del(*keys) if keys.any?
      break if cursor == "0"
    end
  rescue Redis::BaseError
    # noop for environments without Redis
  end
end
