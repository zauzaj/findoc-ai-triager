Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  # Lemon Squeezy webhooks — outside api/v1 namespace, no JWT auth, HMAC-verified
  post "webhooks/lemon_squeezy", to: "webhooks#lemon_squeezy"

  namespace :api do
    namespace :v1 do
      # Auth
      post "auth/google",              to: "auth#google"
      post "auth/apple",               to: "auth#apple"
      post "auth/signup",              to: "auth#signup"
      post "auth/password_login",      to: "auth#password_login"
      post "auth/magic_link",          to: "auth#magic_link"
      get  "auth/magic_link_verify",   to: "auth#magic_link_verify"
      get  "auth/me",                  to: "auth#me"
      post "auth/merge_anonymous",     to: "auth#merge_anonymous"

      # Navigation
      post "navigate",                 to: "navigate#create"
      get  "navigate/history",         to: "navigate#history"

      # Places
      get  "places/search",            to: "places#search"
      get  "places/:place_id",         to: "places#show"
      post "places/:place_id/save",    to: "saved_places#create"
      delete "places/:place_id/save",  to: "saved_places#destroy"
      get  "saved_places",             to: "saved_places#index"
      get  "called_places",            to: "called_places#index"

      # Insurance
      get  "insurance_providers",      to: "insurance_providers#index"
      post "clinic_insurance",         to: "clinic_insurance#create"

      # Tracking
      post "tracking/view",            to: "tracking#view"
      post "tracking/phone_click",     to: "tracking#phone_click"
      post "tracking/directions",      to: "tracking#directions"
      post "tracking/website",         to: "tracking#website"

      # Users — profile updates (onboarding)
      patch "users/me",               to: "users#update"

      # Analytics — client-side event ingestion
      post "analytics/event",         to: "analytics#event"

      # Billing — Lemon Squeezy checkout
      post "billing/checkout",         to: "billing#checkout"
    end
  end
end
