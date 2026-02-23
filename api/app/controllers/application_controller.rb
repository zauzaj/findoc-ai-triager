class ApplicationController < ActionController::API
  rescue_from AuthenticationError,             with: :render_unauthorized
  rescue_from ActiveRecord::RecordNotFound,    with: :render_not_found
  rescue_from ActiveRecord::RecordInvalid,     with: :render_unprocessable
  rescue_from ActionController::ParameterMissing, with: :render_bad_request

  before_action :set_anonymous_id
  around_action :record_request_observability

  private

  def authenticate!
    token = bearer_token
    raise AuthenticationError, "Missing token" unless token
    payload        = JwtService.decode(token)
    @current_user  = User.find(payload["user_id"])
  rescue ActiveRecord::RecordNotFound
    raise AuthenticationError, "User not found"
  end

  def optional_authenticate
    token = bearer_token
    return unless token
    payload       = JwtService.decode(token)
    @current_user = User.find_by(id: payload["user_id"])
  rescue AuthenticationError, ActiveRecord::RecordNotFound
    nil
  end

  def current_user
    @current_user
  end

  def bearer_token
    request.headers["Authorization"]&.split(" ")&.last
  end

  def set_anonymous_id
    @anonymous_id = request.headers["X-Anonymous-Id"] || "anon-#{SecureRandom.hex(8)}"
  end

  def render_unauthorized(e)
    Observability.log_event(event: "auth.failure", level: :warn, reason: e.message, path: request.path, request_id: request.request_id)
    render json: { error: "Unauthorized", message: e.message }, status: :unauthorized
  end

  def render_not_found(e)
    render json: { error: "Not Found", message: e.message }, status: :not_found
  end

  def render_unprocessable(e)
    render json: { error: "Unprocessable Entity", message: e.message }, status: :unprocessable_entity
  end

  def render_bad_request(e)
    render json: { error: "Bad Request", message: e.message }, status: :bad_request
  end

  def record_request_observability
    started_at = Process.clock_gettime(Process::CLOCK_MONOTONIC)
    yield
  ensure
    duration_ms = (Process.clock_gettime(Process::CLOCK_MONOTONIC) - started_at) * 1000.0
    status_code = response&.status || 500
    tags = {
      method: request.request_method,
      path: request.path,
      status: status_code
    }

    Observability.increment("api.request.rate", tags: tags)
    Observability.timing("api.request.latency", duration_ms, tags: tags)
    Observability.increment("api.request.error_rate", tags: tags) if status_code >= 500
  end
end

class AuthenticationError < StandardError; end
