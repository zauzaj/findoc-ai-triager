require "test_helper"

class AiNavigationServiceTest < ActiveSupport::TestCase
  setup { Rails.cache.clear }

  test "navigate returns mocked anthropic triage" do
    with_env("AI_PROVIDER" => "anthropic", "MOCK_EXTERNAL_APIS" => "true") do
      result = AiNavigationService.navigate(symptoms: "chest pain", insurance: "daman")

      assert_equal "Cardiologist", result[:specialist]
      assert_equal "high", result[:urgency]
      assert result[:confidence] > 0.9
    end
  end

  test "navigate supports openai-shaped mocked responses" do
    with_env("AI_PROVIDER" => "openai", "MOCK_EXTERNAL_APIS" => "true") do
      result = AiNavigationService.navigate(symptoms: "fatigue", insurance: nil)

      assert_equal "General Practitioner", result[:specialist]
      assert_equal "low", result[:urgency]
    end
  end

  private

  def with_env(vars)
    old = {}
    vars.each { |k, _| old[k] = ENV[k] }
    vars.each { |k, v| ENV[k] = v }
    yield
  ensure
    old.each { |k, v| v.nil? ? ENV.delete(k) : ENV[k] = v }
  end
end
