class ClinicIdentityService
  SPECIALTY_TYPES = {
    "dentist" => %w[dentist dental_clinic orthodontist],
    "dermatologist" => %w[dermatologist skin_care_clinic medical_spa],
    "cardiologist" => %w[cardiologist heart_hospital],
    "orthopedic" => %w[orthopedic_surgeon orthopedic_clinic sports_medicine_clinic],
    "gynecologist" => %w[obstetrician_gynecologist fertility_clinic women's_health_clinic],
    "pediatrician" => %w[pediatrician children's_hospital],
    "ent" => %w[otolaryngologist],
    "psychiatrist" => %w[psychiatrist mental_health_clinic],
    "ophthalmologist" => %w[ophthalmologist optometrist eye_care_center],
    "general_physician" => %w[doctor medical_clinic family_practice_physician general_practitioner]
  }.freeze

  def self.sync_search_results!(places:)
    place_ids = places.map { |p| p[:place_id].presence }.compact.uniq
    return if place_ids.empty?

    now = Time.current
    Clinic.insert_all(
      place_ids.map do |place_id|
        {
          place_id: place_id,
          subscription_status: "none",
          claim_status: "unclaimed",
          featured_enabled: false,
          enhanced_profile_enabled: false,
          verified_insurance_badge: false,
          created_at: now,
          updated_at: now
        }
      end,
      unique_by: :index_clinics_on_place_id
    )

    specialties = places.flat_map { |place| specialties_for_place(place) }.uniq
    return if specialties.empty?

    ClinicSpecialty.insert_all(
      specialties.map do |row|
        row.merge(created_at: now, updated_at: now)
      end,
      unique_by: :idx_clinic_specialties_unique
    )
  end

  def self.featured_place_id(places:, specialist:, insurance_slug: nil)
    ids = places.map { |p| p[:place_id] }.compact.uniq
    return nil if ids.empty? || specialist.blank?

    scope = Clinic
              .joins(:clinic_specialties)
              .where(place_id: ids, subscription_status: "active", featured_enabled: true)
              .where(clinic_specialties: { specialty_slug: specialist })

    if insurance_slug.present?
      scope = scope.joins("INNER JOIN clinic_insurance_links ON clinic_insurance_links.google_place_id = clinics.place_id")
                   .where(clinic_insurance_links: { insurance_slug: insurance_slug })
    end

    scope.order(Arel.sql("subscription_started_at ASC NULLS LAST, clinics.created_at ASC")).pick(:place_id)
  end

  def self.specialties_for_place(place)
    place_id = place[:place_id].presence
    return [] if place_id.blank?

    google_types = Array(place[:google_types]).map(&:to_s)
    mapped = SPECIALTY_TYPES.each_with_object([]) do |(slug, types), acc|
      next if (google_types & types).empty?
      confidence = (google_types & types).any? ? "high" : "medium"
      acc << { place_id: place_id, specialty_slug: slug, confidence: confidence }
    end

    mapped
  end
end
