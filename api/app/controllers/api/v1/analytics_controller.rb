module Api
  module V1
    # POST /api/v1/analytics/event
    # Receives all client-side analytics events.
    # Fire-and-forget: always returns 200 so tracking never blocks the user.
    class AnalyticsController < ApplicationController
      before_action :optional_authenticate

      ALLOWED_EVENTS = %w[
        navigation_completed
        premium_navigation_completed
        result_cap_shown
        see_all_results_clicked
        auth_prompt_shown
        auth_prompt_dismissed
        auth_started
        auth_completed
        upgrade_modal_shown
        upgrade_modal_dismissed
        upgrade_modal_suppressed
        upgrade_cta_clicked
        checkout_started
        checkout_completed
        checkout_abandoned
        doctor_saved
        navigation_history_viewed
        navigation_counter_transferred
      ].freeze

      def event
        event_name   = params[:event].to_s
        anonymous_id = params[:anonymous_id]
        language     = params[:language] || "en"

        return render json: { ok: true } unless ALLOWED_EVENTS.include?(event_name)

        # Collect properties — everything except top-level fields we store separately
        reserved = %w[event anonymous_id language timestamp user_id token controller action]
        properties = params.to_unsafe_h.except(*reserved)
        properties["timestamp"] = params[:timestamp] || Time.current.iso8601

        # place_id is a first-class column for clinic-level JOIN queries
        place_id = params[:place_id].presence || properties.delete("place_id")

        AnalyticsEvent.create!(
          event_name:   event_name,
          anonymous_id: anonymous_id,
          user_id:      current_user&.id,
          language:     language,
          place_id:     place_id,
          properties:   properties
        )

        render json: { ok: true }
      rescue => e
        Rails.logger.warn "[analytics] #{e.class}: #{e.message}"
        render json: { ok: true } # never return an error to the client
      end
    end
  end
end
