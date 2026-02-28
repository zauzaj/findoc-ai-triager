class AiNavigationService
  CONFIG_PATH      = Rails.root.join("config", "ai", "navigation_v2.md")
  CLAUDE_API_URL   = "https://api.anthropic.com/v1/messages"
  OPENAI_API_URL   = "https://api.openai.com/v1/chat/completions"
  ANTHROPIC_MODEL  = "claude-sonnet-4-6"
  OPENAI_MODEL     = "gpt-4o-mini"
  CACHE_TTL        = 24.hours

  def self.navigate(symptoms:, insurance: nil)
    cache_key = "navigate:v2:#{provider}:#{Digest::MD5.hexdigest("#{symptoms.downcase.strip}::#{insurance}")}"

    Rails.cache.fetch(cache_key, expires_in: CACHE_TTL) do
      result = call_provider(symptoms: symptoms, insurance: insurance)
      parse_response(result, provider: provider)
    end
  end

  private

  def self.provider
    ENV.fetch("AI_PROVIDER", "anthropic")
  end

  def self.system_prompt
    @system_prompt ||= File.read(CONFIG_PATH)
  end

  def self.call_provider(symptoms:, insurance:)
    if MockExternalApiService.enabled?
      return MockExternalApiService.ai_response(provider: provider, symptoms: symptoms, insurance: insurance)
    end

    case provider
    when "openai"
      call_openai(symptoms: symptoms, insurance: insurance)
    else
      call_claude(symptoms: symptoms, insurance: insurance)
    end
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
        model:      ENV.fetch("ANTHROPIC_MODEL", ANTHROPIC_MODEL),
        max_tokens: 512,
        system:     system_prompt,
        messages:   [{ role: "user", content: user_message }]
      }.to_json,
      timeout: 30
    )

    raise "Claude API error #{response.code}" unless response.success?
    response.parsed_response
  end

  def self.call_openai(symptoms:, insurance:)
    user_message = "Patient symptoms: #{symptoms}"
    user_message += "\nInsurance provider: #{insurance}" if insurance.present?

    response = HTTParty.post(
      OPENAI_API_URL,
      headers: {
        "Authorization" => "Bearer #{ENV.fetch('OPENAI_API_KEY')}",
        "content-type"  => "application/json"
      },
      body: {
        model: ENV.fetch("OPENAI_MODEL", OPENAI_MODEL),
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system_prompt },
          { role: "user", content: user_message }
        ]
      }.to_json,
      timeout: 30
    )

    raise "OpenAI API error #{response.code}" unless response.success?
    response.parsed_response
  end

  def self.parse_response(response, provider:)
    text = extract_text(response, provider: provider)
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

  def self.extract_text(response, provider:)
    case provider
    when "openai"
      response.dig("choices", 0, "message", "content").to_s.strip
    else
      response.dig("content", 0, "text").to_s.strip
    end
  end
end
