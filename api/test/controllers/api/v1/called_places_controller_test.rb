require 'test_helper'

class Api::V1::CalledPlacesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = User.create!(
      email: 'called@example.com',
      provider: 'email',
      provider_uid: 'called-user',
      plan: 'free',
      locale: 'en'
    )
    @token = JwtService.encode(user_id: @user.id)
  end

  test 'returns unauthorized without token' do
    get '/api/v1/called_places'

    assert_response :unauthorized
  end

  test 'returns empty called_places when no phone_clicks exist' do
    get '/api/v1/called_places', headers: auth_header

    assert_response :success
    assert_equal [], response.parsed_body['called_places']
  end

  test 'returns grouped called places sorted by recency with latest metadata' do
    now = Time.current
    LeadEvent.create!(google_place_id: 'place-1', event_type: 'phone_click', user: @user, specialty: 'Dermatologist', insurance_filter: 'axa', created_at: now - 2.days)
    LeadEvent.create!(google_place_id: 'place-1', event_type: 'phone_click', user: @user, specialty: 'Cardiologist', insurance_filter: 'daman', created_at: now - 1.day)
    LeadEvent.create!(google_place_id: 'place-2', event_type: 'phone_click', user: @user, specialty: 'Dentist', insurance_filter: 'nextcare', created_at: now - 2.hours)

    PlacesService.stub :show, { name: 'Clinic', address: 'Address', phone: '+971123', maps_url: 'https://maps.example' } do
      get '/api/v1/called_places', headers: auth_header
    end

    assert_response :success
    rows = response.parsed_body['called_places']

    assert_equal %w[place-2 place-1], rows.map { |row| row['google_place_id'] }
    assert_equal 2, rows.last['times_called']
    assert_equal 'Cardiologist', rows.last['specialty']
    assert_equal 'daman', rows.last['insurance']
    assert_equal false, rows.last['partial']
  end

  test 'returns partial row when enrichment fails for a place' do
    LeadEvent.create!(google_place_id: 'broken-place', event_type: 'phone_click', user: @user, specialty: 'Cardiologist', insurance_filter: 'daman')

    PlacesService.stub :show, ->(_place_id) { raise StandardError, 'provider down' } do
      get '/api/v1/called_places', headers: auth_header
    end

    assert_response :success
    row = response.parsed_body['called_places'].first

    assert_equal 'broken-place', row['google_place_id']
    assert_equal true, row['partial']
    assert_nil row['name']
    assert_equal 1, row['times_called']
  end

  private

  def auth_header
    { 'Authorization' => "Bearer #{@token}" }
  end
end
