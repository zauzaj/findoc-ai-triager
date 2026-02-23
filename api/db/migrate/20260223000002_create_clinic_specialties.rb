class CreateClinicSpecialties < ActiveRecord::Migration[7.2]
  def change
    create_table :clinic_specialties do |t|
      t.string :place_id, null: false
      t.string :specialty_slug, null: false
      t.string :confidence, null: false, default: "medium"
      t.timestamps
    end

    add_index :clinic_specialties, [:place_id, :specialty_slug], unique: true, name: "idx_clinic_specialties_unique"
    add_index :clinic_specialties, :specialty_slug
    add_foreign_key :clinic_specialties, :clinics, column: :place_id, primary_key: :place_id
  end
end
