module Api
  module V1
    # PATCH /api/v1/users/me — update profile (emirate, insurance, locale)
    # Used by the post-signup onboarding screen.
    class UsersController < ApplicationController
      before_action :authenticate!

      PERMITTED_FIELDS = %w[emirate insurance_provider locale].freeze

      def update
        attrs = params.require(:user).permit(*PERMITTED_FIELDS)

        if attrs[:locale].present? && !%w[en ar].include?(attrs[:locale])
          return render json: { error: "Invalid locale" }, status: :unprocessable_entity
        end

        current_user.update!(attrs)
        render json: { user: user_json(current_user) }
      end

      private

      def user_json(user)
        {
          id:                     user.id,
          email:                  user.email,
          name:                   user.name,
          avatar_url:             user.avatar_url,
          plan:                   user.plan,
          locale:                 user.locale,
          insurance_provider:     user.insurance_provider,
          emirate:                user.emirate,
          navigations_this_month: user.navigations_this_month,
          ls_subscription_status: user.ls_subscription_status
        }
      end
    end
  end
end
