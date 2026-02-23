module Api
  module V1
    class CalledPlacesController < ApplicationController
      before_action :authenticate!

      MAX_RECORDS = 50

      def index
        grouped_calls = LeadEvent.phone_clicks
                                .where(user_id: current_user.id)
                                .group(:google_place_id)
                                .select(
                                  :google_place_id,
                                  "COUNT(*) AS times_called",
                                  "MAX(created_at) AS last_called_at"
                                )
                                .order("last_called_at DESC")
                                .limit(MAX_RECORDS)

        latest_call_by_place = latest_phone_call_by_place

        called_places = grouped_calls.map do |row|
          latest = latest_call_by_place[row.google_place_id]
          build_called_place(row:, latest:)
        end

        render json: { called_places: called_places }
      end

      private

      def latest_phone_call_by_place
        LeadEvent.phone_clicks
                 .where(user_id: current_user.id)
                 .select("DISTINCT ON (google_place_id) google_place_id, specialty, insurance_filter, created_at")
                 .order("google_place_id, created_at DESC")
                 .index_by(&:google_place_id)
      end

      def build_called_place(row:, latest:)
        details = fetch_place_details(row.google_place_id)

        {
          google_place_id: row.google_place_id,
          name:            details&.dig(:name),
          address:         details&.dig(:address),
          phone:           details&.dig(:phone),
          maps_url:        details&.dig(:maps_url),
          times_called:    row.attributes["times_called"].to_i,
          last_called_at:  row.attributes["last_called_at"],
          specialty:       latest&.specialty,
          insurance:       latest&.insurance_filter,
          partial:         details.blank?
        }
      end

      def fetch_place_details(place_id)
        PlacesService.show(place_id)
      rescue StandardError => e
        Rails.logger.warn("[called_places#index] failed to enrich #{place_id}: #{e.class}: #{e.message}")
        nil
      end
    end
  end
end
