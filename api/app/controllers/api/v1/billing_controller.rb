module Api
  module V1
    class BillingController < ApplicationController
      before_action :authenticate!

      # POST /api/v1/billing/checkout
      # Returns a Lemon Squeezy hosted-checkout URL.
      # The frontend redirects the patient there to complete payment.
      def checkout
        redirect_url = "#{ENV.fetch('WEB_URL', 'http://localhost:3000')}/profile?upgraded=1"

        checkout_url = LemonsqueezyService.create_checkout(
          user:         current_user,
          redirect_url: redirect_url
        )

        render json: { checkout_url: checkout_url }
      rescue KeyError => e
        # ENV vars not configured yet
        render json: { error: "Billing not configured: #{e.message}" }, status: :service_unavailable
      rescue => e
        Rails.logger.error "[billing] checkout error: #{e.message}"
        render json: { error: "Could not create checkout session" }, status: :service_unavailable
      end
    end
  end
end
