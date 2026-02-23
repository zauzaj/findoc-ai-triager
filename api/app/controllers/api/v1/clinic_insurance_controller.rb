module Api
  module V1
    class ClinicInsuranceController < ApplicationController
      before_action :authenticate!

      def create
        provider = InsuranceProvider.find_by!(slug: params.require(:insurance_slug))
        link = ClinicInsuranceLink.find_or_initialize_by(
          google_place_id: params.require(:google_place_id),
          insurance_provider: provider
        )

        link.insurance_slug = provider.slug
        link.reported_by = "user" if link.reported_by.blank?
        link.source = "manual" if link.source.blank?
        link.confidence = "low" if link.confidence.blank?
        link.verified_at = Time.current if link.source == "verified" && link.verified_at.blank?
        link.save!

        render json: { clinic_insurance: { id: link.id, verified: link.verified, confidence: link.confidence, source: link.source } }, status: :created
      end
    end
  end
end
