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

        started_at = Process.clock_gettime(Process::CLOCK_MONOTONIC)
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

        # Increment monthly counter for signed-in users.
        # Anonymous users are counted client-side in localStorage.
        if current_user
          reset_monthly_counter_if_needed!(current_user)
          current_user.increment!(:navigations_this_month)
        end

        duration_ms = (Process.clock_gettime(Process::CLOCK_MONOTONIC) - started_at) * 1000.0
        Observability.log_event(event: "navigate.success", user_id: current_user&.id, specialist: result[:specialist], urgency: result[:urgency], duration_ms: duration_ms.round(1), request_id: request.request_id)
        Observability.timing("navigate.provider.latency", duration_ms, tags: { provider: "claude" })

        render json: {
          session_token:          session.session_token,
          specialist:             result[:specialist],
          urgency:                result[:urgency],
          confidence:             result[:confidence],
          explanation:            result[:explanation],
          navigations_this_month: current_user&.navigations_this_month
        }
      rescue => e
        Observability.log_event(event: "navigate.failure", level: :error, user_id: current_user&.id, error_class: e.class.name, error_message: e.message, request_id: request.request_id)
        Observability.increment("navigate.failure", tags: { error_class: e.class.name })
        Observability.capture_exception(e, context: { action: "navigate#create", user_id: current_user&.id, request_id: request.request_id })
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

      # Resets navigations_this_month to 0 when a new calendar month begins.
      def reset_monthly_counter_if_needed!(user)
        now      = Time.current
        reset_at = user.navigations_reset_at
        if reset_at.nil? || reset_at.year != now.year || reset_at.month != now.month
          user.update_columns(navigations_this_month: 0, navigations_reset_at: now)
        end
      end

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
