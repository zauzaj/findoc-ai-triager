class ExtendClinicInsuranceLinks < ActiveRecord::Migration[7.2]
  def up
    add_column :clinic_insurance_links, :insurance_slug, :string unless column_exists?(:clinic_insurance_links, :insurance_slug)
    add_column :clinic_insurance_links, :source, :string, null: false, default: "manual" unless column_exists?(:clinic_insurance_links, :source)
    add_column :clinic_insurance_links, :confidence, :string, null: false, default: "low" unless column_exists?(:clinic_insurance_links, :confidence)
    add_column :clinic_insurance_links, :verified_at, :datetime unless column_exists?(:clinic_insurance_links, :verified_at)

    execute <<~SQL
      UPDATE clinic_insurance_links cil
      SET insurance_slug = ip.slug
      FROM insurance_providers ip
      WHERE cil.insurance_provider_id = ip.id
        AND (cil.insurance_slug IS NULL OR cil.insurance_slug = '')
    SQL

    change_column_null :clinic_insurance_links, :insurance_slug, false

    add_index :clinic_insurance_links, [:google_place_id, :insurance_slug], name: "idx_clinic_insurance_place_slug" unless index_exists?(:clinic_insurance_links, [:google_place_id, :insurance_slug], name: "idx_clinic_insurance_place_slug")
  end

  def down
    remove_index :clinic_insurance_links, name: "idx_clinic_insurance_place_slug" if index_exists?(:clinic_insurance_links, [:google_place_id, :insurance_slug], name: "idx_clinic_insurance_place_slug")
    remove_column :clinic_insurance_links, :verified_at if column_exists?(:clinic_insurance_links, :verified_at)
    remove_column :clinic_insurance_links, :confidence if column_exists?(:clinic_insurance_links, :confidence)
    remove_column :clinic_insurance_links, :source if column_exists?(:clinic_insurance_links, :source)
    remove_column :clinic_insurance_links, :insurance_slug if column_exists?(:clinic_insurance_links, :insurance_slug)
  end
end
