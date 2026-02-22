module Api
  module V1
    class AuthController < ApplicationController
      before_action :authenticate!, only: [:me, :merge_anonymous]

      def google
        id_token = params.require(:id_token)
        payload  = GoogleAuthService.verify(id_token)
        user     = User.from_google(payload)
        render json: auth_response(user)
      end

      def apple
        uid   = params.require(:uid)
        email = params.require(:email)
        user  = User.find_or_initialize_by(provider: "apple", provider_uid: uid)
        user.email = email if user.new_record?
        user.name  = params[:name] if params[:name].present? && user.name.blank?
        user.save!
        render json: auth_response(user)
      end

      def magic_link
        email = params.require(:email).downcase.strip
        user  = User.find_or_create_by!(email: email) do |u|
          u.provider = "email"
          u.name     = email.split("@").first
        end
        token     = user.generate_magic_link_token!
        magic_url = "#{ENV.fetch('WEB_URL', 'http://localhost:3000')}/auth/verify?token=#{token}"
        Rails.logger.info "[magic_link] #{email} → #{magic_url}"
        render json: { message: "Magic link sent. Check your email.", debug_url: Rails.env.development? ? magic_url : nil }
      end

      def magic_link_verify
        token = params.require(:token)
        user  = User.find_by!(magic_link_token: token)
        return render json: { error: "Magic link expired" }, status: :unauthorized unless user.magic_link_valid?(token)
        user.consume_magic_link!
        render json: auth_response(user)
      end

      def me
        render json: { user: user_json(current_user) }
      end

      # POST /auth/merge_anonymous
      # Transfers the anonymous visitor's navigation count into the signed-in account.
      # Takes max(current server count, anonymous_count) — never resets on sign-in.
      def merge_anonymous
        anon_count = params[:anonymous_count].to_i
        return render json: { user: user_json(current_user) } if anon_count <= 0

        # Reset counter if new month first
        now      = Time.current
        reset_at = current_user.navigations_reset_at
        if reset_at.nil? || reset_at.year != now.year || reset_at.month != now.month
          current_user.update_columns(navigations_this_month: 0, navigations_reset_at: now)
        end

        merged = [current_user.navigations_this_month, anon_count].max
        current_user.update!(navigations_this_month: merged)
        render json: { user: user_json(current_user) }
      end

      private

      def auth_response(user)
        { token: JwtService.encode(user_id: user.id), user: user_json(user) }
      end

      def user_json(user)
        {
          id:                      user.id,
          email:                   user.email,
          name:                    user.name,
          avatar_url:              user.avatar_url,
          plan:                    user.plan,
          locale:                  user.locale,
          insurance_provider:      user.insurance_provider,
          emirate:                 user.emirate,
          navigations_this_month:  user.navigations_this_month,
          ls_subscription_status:  user.ls_subscription_status
        }
      end
    end
  end
end
