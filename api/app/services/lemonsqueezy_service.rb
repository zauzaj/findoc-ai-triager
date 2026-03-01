# Handles all communication with the Lemon Squeezy API.
#
# Required env vars:
#   LS_API_KEY           — Lemon Squeezy API key (Settings → API)
#   LS_STORE_ID          — Numeric store ID
#   LS_VARIANT_ID        — Numeric variant ID of the Premium plan product
#   LS_WEBHOOK_SECRET    — Secret set when registering the webhook in LS dashboard
class LemonsqueezyService
  BASE_URL = "https://api.lemonsqueezy.com/v1".freeze

  # Returns the hosted checkout page URL (redirect the patient there).
  # Passes user_id in custom_data so webhooks can identify the local user.
  def self.create_checkout(user:, redirect_url: nil)
    store_id   = ENV.fetch("LS_STORE_ID")
    variant_id = ENV.fetch("LS_VARIANT_ID")

    body = {
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email: user.email,
            name:  user.name.presence || user.email.split("@").first,
            custom: { user_id: user.id.to_s }
          },
          checkout_options: {},
          product_options: {
            redirect_url: redirect_url
          }.compact
        },
        relationships: {
          store:   { data: { type: "stores",   id: store_id.to_s   } },
          variant: { data: { type: "variants", id: variant_id.to_s } }
        }
      }
    }

    response = HTTParty.post(
      "#{BASE_URL}/checkouts",
      headers: json_api_headers,
      body: body.to_json
    )

    unless response.success?
      Rails.logger.error "[LemonSqueezy] checkout failed #{response.code}: #{response.body}"
      raise "LemonSqueezy API error (#{response.code})"
    end

    response.dig("data", "attributes", "url")
  end

  # Raises ArgumentError if the signature is invalid.
  # Call this before parsing the webhook payload.
  def self.verify_webhook!(raw_body, signature)
    secret   = ENV.fetch("LS_WEBHOOK_SECRET")
    expected = OpenSSL::HMAC.hexdigest("SHA256", secret, raw_body)
    unless ActiveSupport::SecurityUtils.secure_compare(expected, signature.to_s)
      raise ArgumentError, "Webhook signature mismatch"
    end
    true
  end

  private

  def self.json_api_headers
    {
      "Authorization" => "Bearer #{ENV.fetch('LS_API_KEY')}",
      "Accept"        => "application/vnd.api+json",
      "Content-Type"  => "application/vnd.api+json"
    }
  end
end
