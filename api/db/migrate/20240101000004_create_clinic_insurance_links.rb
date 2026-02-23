class CreateClinicInsuranceLinks < ActiveRecord::Migration[7.2]
  def change
    create_table :clinic_insurance_links do |t|
      t.string     :google_place_id,       null: false
      t.references :insurance_provider,    null: false, foreign_key: true
      t.string     :reported_by,           null: false, default: "user"
      t.boolean    :verified,              null: false, default: false
      t.timestamps
    end
    add_index :clinic_insurance_links,
      %i[google_place_id insurance_provider_id],
      unique: true, name: "idx_clinic_insurance_unique"
  end
end
