class JwtService
  ALGORITHM = "HS256"
  EXPIRY    = 30.days

  def self.encode(payload)
    payload = payload.merge(exp: EXPIRY.from_now.to_i)
    JWT.encode(payload, secret, ALGORITHM)
  end

  def self.decode(token)
    decoded = JWT.decode(token, secret, true, algorithm: ALGORITHM)
    decoded.first.with_indifferent_access
  rescue JWT::DecodeError => e
    raise AuthenticationError, "Invalid token: #{e.message}"
  end

  def self.secret
    ENV.fetch("JWT_SECRET", "dev-secret-please-change-in-production")
  end
end
