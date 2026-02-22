module Api
  module V1
    class ClinicInsuranceController < ApplicationController
      before_action :authenticate!

      def create
        provider = InsuranceProvider.find_by!(slug: params.require(:insurance_slug))
        link     = ClinicInsuranceLink.find_or_create_by!(
          google_place_id:      params.require(:google_place_id),
          insurance_provider:   provider
        ) { |l| l.reported_by = "user" }
        render json: { clinic_insurance: { id: link.id, verified: link.verified } }, status: :created
      end
    end
  end
end
