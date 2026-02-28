class MockExternalApiService
  CONFIG_PATH = Rails.root.join("config", "mocks", "external_apis.yml")

  class << self
    def enabled?
      ActiveModel::Type::Boolean.new.cast(ENV.fetch("MOCK_EXTERNAL_APIS", Rails.env.development? || Rails.env.test?))
    end

    def google_places_search(specialty:)
      data = section("google_places", "search")
      by_specialty = data.fetch("by_specialty", {})
      by_specialty[specialty.to_s.downcase] || data.fetch("default", [])
    end

    def google_place_details(place_id:)
      data = section("google_places", "details")
      by_place_id = data.fetch("by_place_id", {})
      by_place_id[place_id.to_s] || data.fetch("default", nil)
    end

    def ai_response(provider:, symptoms:, insurance: nil)
      provider_data = section("ai", provider.to_s)
      pick_ai_payload(provider_data: provider_data, symptoms: symptoms, insurance: insurance)
    end

    private

    def pick_ai_payload(provider_data:, symptoms:, insurance:)
      haystack = [symptoms, insurance].compact.join(" ").downcase
      rules = provider_data.fetch("rules", [])

      match = rules.find do |rule|
        keywords = rule.fetch("keywords", []).map(&:downcase)
        keywords.any? { |keyword| haystack.include?(keyword) }
      end

      if match
        match.fetch("response")
      else
        provider_data.fetch("default")
      end
    end

    def section(*keys)
      keys.reduce(config_for_profile) { |memo, key| memo.fetch(key.to_s) }
    end

    def config_for_profile
      @config_for_profile ||= begin
        all = YAML.unsafe_load_file(CONFIG_PATH)
        profile = ENV.fetch("MOCK_API_PROFILE", Rails.env)
        all.fetch(profile.to_s) { all.fetch("default") }
      end
    end
  end
end
