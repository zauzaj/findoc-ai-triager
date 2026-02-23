module Api
  module V1
    class PlacesController < ApplicationController
      # GET /api/v1/places/search
      # Search for clinics by specialty and location
      #
      # Shadow Clinic Creation:
      #   - PlacesService.search calls Google Places API
      #   - For each result, a shadow Clinic record is created/persisted
      #   - This preserves analytics continuity from first appearance
      #   - Enables future claim attachment and monetization
      #
      # Parameters:
      #   - specialist: Medical specialty (required)
      #   - lat, lng: User location (optional)
      #   - insurance: Insurance provider slug (optional, for filtering)
      def search
        specialist = params.require(:specialist)
        places     = PlacesService.search(
          specialty: specialist,
          lat:       params[:lat],
          lng:       params[:lng],
          insurance: params[:insurance]
        )
        # Enrich results with verified insurance data from local database
        places = enrich_insurance(places, params[:insurance]) if params[:insurance].present?
        render json: { places: places }
      end

      def show
        place = PlacesService.show(params[:place_id])
        return render json: { error: "Place not found" }, status: :not_found unless place
        render json: { place: place }
      end

      private

      def enrich_insurance(places, insurance_slug)
        ids     = places.map { |p| p[:place_id] }
        matched = ClinicInsuranceLink
                    .joins(:insurance_provider)
                    .where(google_place_id: ids,
                           insurance_providers: { slug: insurance_slug },
                           verified: true)
                    .pluck(:google_place_id).to_set

        places.map { |p| p.merge(insurance_accepted: matched.include?(p[:place_id]) ? [insurance_slug] : []) }
      end
    end
  end
end
