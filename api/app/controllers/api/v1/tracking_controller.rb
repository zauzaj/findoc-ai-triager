module Api
  module V1
    class TrackingController < ApplicationController
      before_action :optional_authenticate

      EVENT_MAP = {
        "view"         => "view",
        "phone_click"  => "phone_click",
        "directions"   => "directions_click",
        "website"      => "website_click"
      }.freeze

      EVENT_MAP.each_key do |action|
        define_method(action) { track(EVENT_MAP[action]) }
      end

      private

      def track(event_type)
        LeadEvent.create!(
          google_place_id:      params.require(:google_place_id),
          event_type:           event_type,
          navigation_session_id: params[:session_id],
          user:                 current_user,
          specialty:            params[:specialty],
          insurance_filter:     params[:insurance],
          source:               params[:source],
          user_agent:           request.user_agent,
          anonymous_id:         @anonymous_id
        )
        render json: { ok: true }
      end
    end
  end
end
