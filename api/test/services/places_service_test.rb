require "test_helper"

class PlacesServiceTest < ActiveSupport::TestCase
  setup { Rails.cache.clear }

  test "search uses mocked google places fixtures when enabled" do
    with_env("MOCK_EXTERNAL_APIS" => "true") do
      result = PlacesService.search(specialty: "cardiologist", lat: 25.2, lng: 55.3)

      assert_equal "mock-cardio-01", result.first[:place_id]
      assert_equal "HeartCare Specialist Center", result.first[:name]
    end
  end

  test "show returns mocked place details for place_id" do
    with_env("MOCK_EXTERNAL_APIS" => "true") do
      place = PlacesService.show("mock-derma-01")

      assert_equal "mock-derma-01", place[:place_id]
      assert_equal "SkinFirst Dermatology", place[:name]
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
