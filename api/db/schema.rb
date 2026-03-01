# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.2].define(version: 2026_02_28_000001) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "analytics_events", force: :cascade do |t|
    t.string "event_name", null: false
    t.string "anonymous_id"
    t.bigint "user_id"
    t.string "language", default: "en"
    t.jsonb "properties", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "place_id"
    t.index ["anonymous_id"], name: "index_analytics_events_on_anonymous_id"
    t.index ["created_at"], name: "index_analytics_events_on_created_at"
    t.index ["event_name"], name: "index_analytics_events_on_event_name"
    t.index ["place_id", "event_name"], name: "index_analytics_events_on_place_id_and_event_name", where: "(place_id IS NOT NULL)"
    t.index ["place_id"], name: "index_analytics_events_on_place_id", where: "(place_id IS NOT NULL)"
    t.index ["properties"], name: "index_analytics_events_on_properties", using: :gin
    t.index ["user_id"], name: "index_analytics_events_on_user_id"
  end

  create_table "clinic_insurance_links", force: :cascade do |t|
    t.string "google_place_id", null: false
    t.bigint "insurance_provider_id", null: false
    t.string "reported_by", default: "user", null: false
    t.boolean "verified", default: false, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "insurance_slug", null: false
    t.string "source", default: "manual", null: false
    t.string "confidence", default: "low", null: false
    t.datetime "verified_at"
    t.index ["google_place_id", "insurance_provider_id"], name: "idx_clinic_insurance_unique", unique: true
    t.index ["google_place_id", "insurance_slug"], name: "idx_clinic_insurance_place_slug"
    t.index ["insurance_provider_id"], name: "index_clinic_insurance_links_on_insurance_provider_id"
  end

  create_table "clinic_leads_monthly", force: :cascade do |t|
    t.string "google_place_id", null: false
    t.integer "year", null: false
    t.integer "month", null: false
    t.integer "total_views", default: 0, null: false
    t.integer "phone_clicks", default: 0, null: false
    t.integer "directions_clicks", default: 0, null: false
    t.integer "website_clicks", default: 0, null: false
    t.integer "whatsapp_shares", default: 0, null: false
    t.integer "unique_visitors", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["google_place_id", "year", "month"], name: "idx_clinic_leads_monthly_unique", unique: true
  end

  create_table "clinic_specialties", force: :cascade do |t|
    t.string "place_id", null: false
    t.string "specialty_slug", null: false
    t.string "confidence", default: "medium", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["place_id", "specialty_slug"], name: "idx_clinic_specialties_unique", unique: true
    t.index ["specialty_slug"], name: "index_clinic_specialties_on_specialty_slug"
  end

  create_table "clinics", force: :cascade do |t|
    t.string "place_id", null: false
    t.bigint "claimed_by_user_id"
    t.string "claim_status", default: "unclaimed", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "subscription_status", default: "none", null: false
    t.datetime "subscription_started_at"
    t.datetime "subscription_expires_at"
    t.boolean "featured_enabled", default: false, null: false
    t.boolean "enhanced_profile_enabled", default: false, null: false
    t.text "short_description"
    t.boolean "verified_insurance_badge", default: false, null: false
    t.index ["claim_status"], name: "index_clinics_on_claim_status"
    t.index ["claimed_by_user_id"], name: "index_clinics_on_claimed_by_user_id"
    t.index ["place_id"], name: "index_clinics_on_place_id", unique: true
    t.index ["subscription_status"], name: "index_clinics_on_subscription_status"
  end

  create_table "insurance_providers", force: :cascade do |t|
    t.string "name", null: false
    t.string "slug", null: false
    t.string "full_name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["slug"], name: "index_insurance_providers_on_slug", unique: true
  end

  create_table "lead_events", force: :cascade do |t|
    t.string "google_place_id", null: false
    t.bigint "navigation_session_id"
    t.bigint "user_id"
    t.string "event_type", null: false
    t.string "specialty"
    t.string "insurance_filter"
    t.string "source"
    t.string "user_agent"
    t.string "anonymous_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["anonymous_id"], name: "index_lead_events_on_anonymous_id"
    t.index ["event_type"], name: "index_lead_events_on_event_type"
    t.index ["google_place_id", "created_at"], name: "index_lead_events_on_google_place_id_and_created_at"
    t.index ["navigation_session_id"], name: "index_lead_events_on_navigation_session_id"
    t.index ["user_id"], name: "index_lead_events_on_user_id"
  end

  create_table "navigation_sessions", force: :cascade do |t|
    t.bigint "user_id"
    t.string "session_token", null: false
    t.jsonb "messages", default: [], null: false
    t.text "initial_symptoms"
    t.string "recommended_specialist"
    t.string "urgency_level"
    t.text "explanation"
    t.string "google_maps_query"
    t.string "insurance_filter"
    t.float "location_lat"
    t.float "location_lng"
    t.string "status", default: "active", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_at"], name: "index_navigation_sessions_on_created_at"
    t.index ["session_token"], name: "index_navigation_sessions_on_session_token", unique: true
    t.index ["status"], name: "index_navigation_sessions_on_status"
    t.index ["user_id"], name: "index_navigation_sessions_on_user_id"
  end

  create_table "plans", force: :cascade do |t|
    t.string "slug", null: false
    t.string "name", null: false
    t.integer "price_aed_cents", default: 0, null: false
    t.integer "nav_limit_monthly", default: 3, null: false
    t.integer "result_limit", default: 10, null: false
    t.boolean "can_save_doctors", default: false, null: false
    t.boolean "can_view_history", default: false, null: false
    t.string "ls_variant_id"
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["ls_variant_id"], name: "index_plans_on_ls_variant_id", unique: true, where: "(ls_variant_id IS NOT NULL)"
    t.index ["slug"], name: "index_plans_on_slug", unique: true
  end

  create_table "saved_places", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "google_place_id", null: false
    t.string "specialty"
    t.text "notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "google_place_id"], name: "index_saved_places_on_user_id_and_google_place_id", unique: true
    t.index ["user_id"], name: "index_saved_places_on_user_id"
  end

  create_table "subscriptions", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "plan_id", null: false
    t.string "ls_subscription_id"
    t.string "ls_customer_id"
    t.string "status", default: "active", null: false
    t.datetime "current_period_start"
    t.datetime "current_period_end"
    t.datetime "trial_ends_at"
    t.datetime "cancelled_at"
    t.datetime "expires_at"
    t.integer "billing_day"
    t.jsonb "metadata", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["current_period_end"], name: "index_subscriptions_on_current_period_end"
    t.index ["ls_customer_id"], name: "index_subscriptions_on_ls_customer_id"
    t.index ["ls_subscription_id"], name: "index_subscriptions_on_ls_subscription_id", unique: true
    t.index ["metadata"], name: "index_subscriptions_on_metadata", using: :gin
    t.index ["plan_id"], name: "index_subscriptions_on_plan_id"
    t.index ["status"], name: "index_subscriptions_on_status"
    t.index ["user_id", "status"], name: "index_subscriptions_on_user_id_and_status"
    t.index ["user_id"], name: "index_subscriptions_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "email", null: false
    t.string "name"
    t.string "provider", default: "email", null: false
    t.string "provider_uid"
    t.string "avatar_url"
    t.string "plan", default: "free", null: false
    t.string "locale", default: "en", null: false
    t.string "insurance_provider"
    t.float "latitude"
    t.float "longitude"
    t.string "emirate"
    t.integer "navigations_this_month", default: 0, null: false
    t.datetime "navigations_reset_at"
    t.string "magic_link_token"
    t.datetime "magic_link_expires_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "ls_subscription_id"
    t.string "ls_subscription_status"
    t.bigint "current_plan_id"
    t.string "password_digest"
    t.index ["current_plan_id"], name: "index_users_on_current_plan_id"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["ls_subscription_id"], name: "index_users_on_ls_subscription_id"
    t.index ["magic_link_token"], name: "index_users_on_magic_link_token", unique: true
    t.index ["provider", "provider_uid"], name: "idx_users_provider_uid", unique: true
  end

  add_foreign_key "clinic_insurance_links", "insurance_providers"
  add_foreign_key "clinic_specialties", "clinics", column: "place_id", primary_key: "place_id"
  add_foreign_key "clinics", "users", column: "claimed_by_user_id"
  add_foreign_key "lead_events", "navigation_sessions"
  add_foreign_key "lead_events", "users"
  add_foreign_key "navigation_sessions", "users"
  add_foreign_key "saved_places", "users"
  add_foreign_key "subscriptions", "plans"
  add_foreign_key "subscriptions", "users"
  add_foreign_key "users", "plans", column: "current_plan_id"
end
