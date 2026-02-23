class CreateClinicListings < ActiveRecord::Migration[7.2]
  def change
    create_table :clinic_listings do |t|
      t.string     :google_place_id, null: false
      t.references :claimed_by,      null: true, foreign_key: { to_table: :users }
      t.string     :status,          null: false, default: "unclaimed"
      t.text       :custom_description
      t.jsonb      :custom_photos,   default: []
      t.string     :booking_url
      t.string     :phone_override
      t.string     :website_override
      t.jsonb      :specialties,             default: []
      t.jsonb      :languages_spoken,        default: []
      t.jsonb      :accepted_insurance,      default: []
      t.string     :lemon_squeezy_subscription_id
      t.timestamps
    end
    add_index :clinic_listings, :google_place_id, unique: true
    add_index :clinic_listings, :status
  end
end
