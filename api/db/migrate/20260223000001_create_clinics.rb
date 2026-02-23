class CreateClinics < ActiveRecord::Migration[7.2]
  def change
    # Shadow Clinic Records
    # Minimal persistence layer for Google Places clinics
    # Purpose: Analytics continuity, claim enablement, monetization path
    # Source of truth for clinic identity: place_id (Google Places)
    create_table :clinics do |t|
      # Google Places canonical identifier (unique)
      t.string :place_id, null: false

      # Subscription status: 'none' | 'active' | 'expired'
      # Controls whether clinic is eligible for paid features
      t.string :subscription_status, null: false, default: 'none'

      # Claim status: 'unclaimed' | 'claimed'
      # Tracks if clinic has claimed their profile
      t.string :claim_status, null: false, default: 'unclaimed'

      # Feature flags for monetization
      # featured_enabled: Can appear in featured slots (paid)
      # enhanced_profile_enabled: Can use custom profile (paid)
      t.boolean :featured_enabled, null: false, default: false
      t.boolean :enhanced_profile_enabled, null: false, default: false

      # Timestamps
      t.timestamps
    end

    # Indexes for query performance
    add_index :clinics, :place_id, unique: true
    add_index :clinics, :subscription_status
    add_index :clinics, :claim_status
  end
end
