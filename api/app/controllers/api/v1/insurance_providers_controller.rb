module Api
  module V1
    class InsuranceProvidersController < ApplicationController
      def index
        providers = InsuranceProvider.order(:name).map do |p|
          { id: p.id, name: p.name, slug: p.slug, full_name: p.full_name }
        end
        render json: { insurance_providers: providers }
      end
    end
  end
end
