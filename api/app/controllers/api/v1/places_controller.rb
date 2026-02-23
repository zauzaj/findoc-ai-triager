module Api
  module V1
    class PlacesController < ApplicationController
      def search
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

        render json: { places: places }
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
