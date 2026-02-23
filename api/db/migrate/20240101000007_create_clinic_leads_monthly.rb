class CreateClinicLeadsMonthly < ActiveRecord::Migration[7.2]
  def change
    create_table :clinic_leads_monthly do |t|
      t.string  :google_place_id,    null: false
      t.integer :year,               null: false
      t.integer :month,              null: false
      t.integer :total_views,        null: false, default: 0
      t.integer :phone_clicks,       null: false, default: 0
      t.integer :directions_clicks,  null: false, default: 0
      t.integer :website_clicks,     null: false, default: 0
      t.integer :whatsapp_shares,    null: false, default: 0
      t.integer :unique_visitors,    null: false, default: 0
      t.timestamps
    end
    add_index :clinic_leads_monthly,
      %i[google_place_id year month],
      unique: true, name: "idx_clinic_leads_monthly_unique"
  end
end
