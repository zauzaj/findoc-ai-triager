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

    cached = Rails.cache.read(cache_key)
    if cached
      Observability.increment("redis.cache.hit", tags: { flow: "places.search" })
      Observability.log_event(event: "places_search.cache", cache_status: "hit", specialty: specialty, insurance: insurance)
      return cached
    end

    Observability.increment("redis.cache.miss", tags: { flow: "places.search" })
    Observability.log_event(event: "places_search.cache", cache_status: "miss", specialty: specialty, insurance: insurance)

    data = fetch_search(specialty: specialty, lat: lat_r, lng: lng_r)
    Rails.cache.write(cache_key, data, expires_in: SEARCH_TTL)
    data
  end

  def self.show(place_id)
    cache_key = "place_details:v1:#{place_id}"
    cached = Rails.cache.read(cache_key)
    return cached if cached

    data = fetch_details(place_id)
    Rails.cache.write(cache_key, data, expires_in: DETAILS_TTL) if data
    data
  end

  private

  def self.fetch_search(specialty:, lat:, lng:)
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

    unless response.success?
      Observability.increment("external_api.failure", tags: { provider: "google_places", endpoint: "search", code: response.code })
      Observability.log_event(event: "external_api.failure", level: :warn, provider: "google_places", endpoint: "search", code: response.code)
      return []
    end

    (response.parsed_response["places"] || []).map { |p| format_place(p) }
  rescue => e
    Observability.increment("external_api.failure", tags: { provider: "google_places", endpoint: "search", error_class: e.class.name })
    Observability.capture_exception(e, context: { provider: "google_places", endpoint: "search" })
    []
  end

  def self.fetch_details(place_id)
    response = HTTParty.get(
      "#{DETAILS_URL}/#{place_id}",
      headers: {
        "X-Goog-Api-Key"   => ENV.fetch("GOOGLE_PLACES_API_KEY"),
        "X-Goog-FieldMask" => DETAILS_FIELDS
      },
      timeout: 10
    )

    unless response.success?
      Observability.increment("external_api.failure", tags: { provider: "google_places", endpoint: "details", code: response.code })
      return nil
    end

    format_place(response.parsed_response)
  rescue => e
    Observability.increment("external_api.failure", tags: { provider: "google_places", endpoint: "details", error_class: e.class.name })
    Observability.capture_exception(e, context: { provider: "google_places", endpoint: "details" })
    nil
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
