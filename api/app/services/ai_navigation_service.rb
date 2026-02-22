class AiNavigationService
  CONFIG_PATH    = Rails.root.join("config", "ai", "navigation_v2.md")
  CLAUDE_API_URL = "https://api.anthropic.com/v1/messages"
  MODEL          = "claude-sonnet-4-6"
  CACHE_TTL      = 24.hours

  def self.navigate(symptoms:, insurance: nil)
    cache_key = "navigate:v1:#{Digest::MD5.hexdigest("#{symptoms.downcase.strip}::#{insurance}")}"

    Rails.cache.fetch(cache_key, expires_in: CACHE_TTL) do
      result = call_claude(symptoms: symptoms, insurance: insurance)
      parse_response(result)
    end
  end

  private

  def self.system_prompt
    @system_prompt ||= File.read(CONFIG_PATH)
  end

  def self.call_claude(symptoms:, insurance:)
    user_message = "Patient symptoms: #{symptoms}"
    user_message += "\nInsurance provider: #{insurance}" if insurance.present?

    response = HTTParty.post(
      CLAUDE_API_URL,
      headers: {
        "x-api-key"         => ENV.fetch("ANTHROPIC_API_KEY"),
        "anthropic-version" => "2023-06-01",
        "content-type"      => "application/json"
      },
      body: {
        model:      MODEL,
        max_tokens: 512,
        system:     system_prompt,
        messages:   [{ role: "user", content: user_message }]
      }.to_json,
      timeout: 30
    )

    raise "Claude API error #{response.code}" unless response.success?
    response.parsed_response
  end

  def self.parse_response(response)
    text = response.dig("content", 0, "text").to_s.strip
    parsed = JSON.parse(text)
    {
      specialist:  parsed["specialist"]  || "General Practitioner",
      urgency:     parsed["urgency"]     || "low",
      confidence:  parsed["confidence"].to_f,
      explanation: parsed["explanation"] || text
    }
  rescue JSON::ParserError
    { specialist: "General Practitioner", urgency: "low", confidence: 0.4, explanation: text }
  end
end
