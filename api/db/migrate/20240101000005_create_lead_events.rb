class CreateLeadEvents < ActiveRecord::Migration[7.2]
  def change
    create_table :lead_events do |t|
      t.string     :google_place_id,     null: false
      t.references :navigation_session,  null: true, foreign_key: true
      t.references :user,                null: true, foreign_key: true
      t.string     :event_type,          null: false
      t.string     :specialty
      t.string     :insurance_filter
      t.string     :source
      t.string     :user_agent
      t.string     :anonymous_id
      t.timestamps
    end
    add_index :lead_events, %i[google_place_id created_at]
    add_index :lead_events, :event_type
    add_index :lead_events, :anonymous_id
  end
end
