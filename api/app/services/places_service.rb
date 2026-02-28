class PlacesService
  SEARCH_URL  = "https://places.googleapis.com/v1/places:searchText"
  DETAILS_URL = "https://places.googleapis.com/v1/places"
  SEARCH_TTL  = 12.hours
  DETAILS_TTL = 7.days
  SEARCH_FIELDS = "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.nationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.types"
  DETAILS_FIELDS = "id,displayName,formattedAddress,location,rating,nationalPhoneNumber,websiteUri,googleMapsUri,regularOpeningHours,photos,types"

  def self.search(specialty:, lat: nil, lng: nil, insurance: nil)
    lat_r = lat.to_f.round(2)
    lng_r = lng.to_f.round(2)
    cache_key = "places_search:v1:#{specialty.downcase}:#{lat_r}:#{lng_r}:#{insurance || 'blank'}"

    Rails.cache.fetch(cache_key, expires_in: SEARCH_TTL) do
      fetch_search(specialty: specialty, lat: lat_r, lng: lng_r)
    end
  end

  def self.show(place_id)
    cache_key = "place_details:v1:#{place_id}"
    Rails.cache.fetch(cache_key, expires_in: DETAILS_TTL) do
      fetch_details(place_id)
    end
  end

  private

  def self.fetch_search(specialty:, lat:, lng:)
    if MockExternalApiService.enabled?
      mocked_places = MockExternalApiService.google_places_search(specialty: specialty)
      return mocked_places.map { |place| format_place(place) }
    end

    body = { textQuery: "#{specialty} clinic", maxResultCount: 20 }
    if lat != 0.0 && lng != 0.0
      body[:locationBias] = {
        circle: { center: { latitude: lat, longitude: lng }, radius: 5000.0 }
      }
    end

    response = HTTParty.post(
      SEARCH_URL,
      headers: {
        "X-Goog-Api-Key"  => ENV.fetch("GOOGLE_PLACES_API_KEY"),
        "X-Goog-FieldMask" => SEARCH_FIELDS,
        "Content-Type"    => "application/json"
      },
      body: body.to_json,
      timeout: 10
    )

    return [] unless response.success?
    (response.parsed_response["places"] || []).map { |p| format_place(p) }
  end

  def self.fetch_details(place_id)
    if MockExternalApiService.enabled?
      mocked_place = MockExternalApiService.google_place_details(place_id: place_id)
      return mocked_place ? format_place(mocked_place) : nil
    end

    response = HTTParty.get(
      "#{DETAILS_URL}/#{place_id}",
      headers: {
        "X-Goog-Api-Key"   => ENV.fetch("GOOGLE_PLACES_API_KEY"),
        "X-Goog-FieldMask" => DETAILS_FIELDS
      },
      timeout: 10
    )
    return nil unless response.success?
    format_place(response.parsed_response)
  end

  def self.format_place(p)
    {
      id:                p["id"],
      place_id:          p["id"],
      name:              p.dig("displayName", "text") || p["displayName"],
      address:           p["formattedAddress"],
      lat:               p.dig("location", "latitude"),
      lng:               p.dig("location", "longitude"),
      rating:            p["rating"].to_f,
      phone:             p["nationalPhoneNumber"],
      website:           p["websiteUri"],
      maps_url:          p["googleMapsUri"],
      distance:          0,
      insurance_accepted: [],
      google_types:       p["types"] || [],
      featured:           false
    }
  end
end
