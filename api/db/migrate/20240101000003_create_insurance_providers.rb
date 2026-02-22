class CreateInsuranceProviders < ActiveRecord::Migration[7.2]
  def change
    create_table :insurance_providers do |t|
      t.string :name,      null: false
      t.string :slug,      null: false
      t.string :full_name
      t.timestamps
    end
    add_index :insurance_providers, :slug, unique: true
  end
end
