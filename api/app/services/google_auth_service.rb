class GoogleAuthService
  TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo"

  def self.verify(id_token)
    response = HTTParty.get(TOKEN_INFO_URL, query: { id_token: id_token })
    raise AuthenticationError, "Google token verification failed" unless response.success?

    payload = response.parsed_response
    raise AuthenticationError, "Token error: #{payload['error_description']}" if payload["error"]

    payload
  end
end
