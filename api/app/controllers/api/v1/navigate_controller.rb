module Api
  module V1
    class NavigateController < ApplicationController
      before_action :optional_authenticate
      before_action :authenticate!, only: [:history]

      def create
        symptoms  = params.require(:symptoms)
        insurance = params[:insurance]
        lat       = params[:lat]
        lng       = params[:lng]

        result = AiNavigationService.navigate(symptoms: symptoms, insurance: insurance)

        session = NavigationSession.create!(
          user:                   current_user,
          initial_symptoms:       symptoms,
          recommended_specialist: result[:specialist],
          urgency_level:          result[:urgency],
          explanation:            result[:explanation],
          insurance_filter:       insurance,
          location_lat:           lat,
          location_lng:           lng,
          status:                 "completed",
          messages: [
            { role: "user",      content: symptoms },
            { role: "assistant", content: result[:explanation] }
          ]
        )

        render json: {
          session_token: session.session_token,
          specialist:    result[:specialist],
          urgency:       result[:urgency],
          confidence:    result[:confidence],
          explanation:   result[:explanation]
        }
      rescue => e
        Rails.logger.error "[navigate#create] #{e.class}: #{e.message}"
        render json: { error: "Navigation unavailable. Please try again." }, status: :service_unavailable
      end

      def history
        sessions = current_user.navigation_sessions
                               .completed
                               .recent
                               .limit(50)
        render json: { history: sessions.map { |s| session_json(s) } }
      end

      private

      def session_json(s)
        {
          id:                     s.id,
          session_token:          s.session_token,
          initial_symptoms:       s.initial_symptoms,
          recommended_specialist: s.recommended_specialist,
          urgency_level:          s.urgency_level,
          explanation:            s.explanation,
          insurance_filter:       s.insurance_filter,
          created_at:             s.created_at
        }
      end
    end
  end
end
