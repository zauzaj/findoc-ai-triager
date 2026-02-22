module Api
  module V1
    class PlacesController < ApplicationController
      def search
        specialist = params.require(:specialist)
        places     = PlacesService.search(
          specialty: specialist,
          lat:       params[:lat],
          lng:       params[:lng],
          insurance: params[:insurance]
        )
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
