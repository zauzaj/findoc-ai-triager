require "test_helper"

class MockExternalApiServiceTest < ActiveSupport::TestCase
  test "returns specialty-specific mocked Google Places search payload" do
    places = MockExternalApiService.google_places_search(specialty: "cardiologist")

    assert_equal "mock-cardio-01", places.first["id"]
    assert_equal "HeartCare Specialist Center", places.first.dig("displayName", "text")
  end

  test "returns provider-specific mocked AI payload for anthropic" do
    response = MockExternalApiService.ai_response(
      provider: "anthropic",
      symptoms: "chest pain and shortness of breath",
      insurance: "daman"
    )

    text = response.dig("content", 0, "text")
    assert_includes text, "Cardiologist"
    assert_includes text, '"urgency":"high"'
  end

  test "returns provider-specific mocked AI payload for openai" do
    response = MockExternalApiService.ai_response(
      provider: "openai",
      symptoms: "persistent mild fatigue",
      insurance: nil
    )

    content = response.dig("choices", 0, "message", "content")
    assert_includes content, "General Practitioner"
  end
end
