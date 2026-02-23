module Api
  module V1
    class PlacesController < ApplicationController
      def search
        specialist = nil
        insurance = nil
        specialist = params.require(:specialist)
        insurance = params[:insurance].presence

        places = PlacesService.search(
          specialty: specialist,
          lat: params[:lat],
          lng: params[:lng],
          insurance: insurance
        )

        ClinicIdentityService.sync_search_results!(places: places)
        places = enrich_insurance(places, insurance) if insurance.present?
        places = apply_featured_slot(places, specialist: specialist, insurance: insurance)

        Observability.log_event(event: "places_search.success", specialist: specialist, insurance: insurance, result_count: places.size, request_id: request.request_id)
        render json: { places: places }
      rescue => e
        Observability.log_event(event: "places_search.failure", level: :error, specialist: specialist, insurance: insurance, error_class: e.class.name, error_message: e.message, request_id: request.request_id)
        Observability.capture_exception(e, context: { action: "places#search", request_id: request.request_id })
        render json: { error: "Places search unavailable" }, status: :service_unavailable
      end

      def show
        place = PlacesService.show(params[:place_id])
        return render json: { error: "Place not found" }, status: :not_found unless place

        render json: { place: place }
      end

      private

      def enrich_insurance(places, insurance_slug)
        ids = places.map { |p| p[:place_id] }

        matched = ClinicInsuranceLink
                    .where(google_place_id: ids, insurance_slug: insurance_slug)
                    .pluck(:google_place_id)
                    .to_set

        places.map do |p|
          p.merge(insurance_accepted: matched.include?(p[:place_id]) ? [insurance_slug] : [])
        end
      end

      def apply_featured_slot(places, specialist:, insurance: nil)
        featured_place_id = ClinicIdentityService.featured_place_id(
          places: places,
          specialist: specialist,
          insurance_slug: insurance
        )

        return places.map { |p| p.merge(featured: false) } if featured_place_id.blank?

        idx = places.index { |p| p[:place_id] == featured_place_id }
        return places.map { |p| p.merge(featured: false) } if idx.nil?

        featured = places.delete_at(idx)
        insert_index = places.length >= 2 ? 1 : places.length
        places.insert(insert_index, featured)

        places.map { |p| p.merge(featured: p[:place_id] == featured_place_id) }
      end
    end
  end
end
