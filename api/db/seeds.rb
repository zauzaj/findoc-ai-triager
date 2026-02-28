# ── Plans ─────────────────────────────────────────────────────────────────────
# nav_limit_monthly: 0 = unlimited
# result_limit: 0 = unlimited
# price_aed_cents stored as integer (1899 = AED 18.99)

Plan.find_or_create_by!(slug: "free") do |p|
  p.name               = "Free"
  p.price_aed_cents    = 0
  p.nav_limit_monthly  = 3
  p.result_limit       = 10
  p.can_save_doctors   = false
  p.can_view_history   = false
  p.active             = true
end

Plan.find_or_create_by!(slug: "premium") do |p|
  p.name               = "Premium"
  p.price_aed_cents    = 1899
  p.nav_limit_monthly  = 0     # unlimited
  p.result_limit       = 0     # unlimited
  p.can_save_doctors   = true
  p.can_view_history   = true
  p.ls_variant_id      = ENV.fetch("LS_VARIANT_ID", nil)
  p.active             = true
end

puts "Seeded #{Plan.count} plans"

# ── Insurance Providers ────────────────────────────────────────────────────────
InsuranceProvider.find_or_create_by!(slug: "daman")      { |p| p.name = "Daman";           p.full_name = "Daman National Health Insurance Company" }
InsuranceProvider.find_or_create_by!(slug: "axa")        { |p| p.name = "AXA";             p.full_name = "AXA Gulf Insurance" }
InsuranceProvider.find_or_create_by!(slug: "bupa")       { |p| p.name = "Bupa";            p.full_name = "Bupa Arabia" }
InsuranceProvider.find_or_create_by!(slug: "nextcare")   { |p| p.name = "Nextcare";        p.full_name = "Nextcare UAE" }
InsuranceProvider.find_or_create_by!(slug: "metlife")    { |p| p.name = "MetLife";         p.full_name = "MetLife UAE" }
InsuranceProvider.find_or_create_by!(slug: "oman-ins")   { |p| p.name = "Oman Insurance";  p.full_name = "Oman Insurance Company" }
InsuranceProvider.find_or_create_by!(slug: "neuron")     { |p| p.name = "Neuron";          p.full_name = "Neuron Insurance UAE" }
InsuranceProvider.find_or_create_by!(slug: "allianz")    { |p| p.name = "Allianz";         p.full_name = "Allianz Care UAE" }

puts "Seeded #{InsuranceProvider.count} insurance providers"

# ── Mock data for local/dev testing ──────────────────────────────────────────
if ActiveModel::Type::Boolean.new.cast(ENV.fetch("SEED_MOCK_DATA", Rails.env.development? || Rails.env.test?))
  mock_links = [
    { google_place_id: "mock-cardio-01", insurance_slug: "daman" },
    { google_place_id: "mock-cardio-02", insurance_slug: "axa" },
    { google_place_id: "mock-derma-01", insurance_slug: "nextcare" },
    { google_place_id: "mock-gp-01", insurance_slug: "bupa" }
  ]

  mock_links.each do |attrs|
    provider = InsuranceProvider.find_by!(slug: attrs[:insurance_slug])
    ClinicInsuranceLink.find_or_create_by!(
      google_place_id: attrs[:google_place_id],
      insurance_provider: provider,
      insurance_slug: provider.slug
    )
  end

  puts "Seeded #{mock_links.size} mock clinic-insurance links"
end
