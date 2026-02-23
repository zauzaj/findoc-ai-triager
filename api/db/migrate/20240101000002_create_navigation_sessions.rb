class CreateNavigationSessions < ActiveRecord::Migration[7.2]
  def change
    create_table :navigation_sessions do |t|
      t.references :user,                null: true,  foreign_key: true
      t.string  :session_token,          null: false
      t.jsonb   :messages,               null: false, default: []
      t.text    :initial_symptoms
      t.string  :recommended_specialist
      t.string  :urgency_level
      t.text    :explanation
      t.string  :google_maps_query
      t.string  :insurance_filter
      t.float   :location_lat
      t.float   :location_lng
      t.string  :status,                 null: false, default: "active"
      t.timestamps
    end
    add_index :navigation_sessions, :session_token, unique: true
    add_index :navigation_sessions, :status
    add_index :navigation_sessions, :created_at
  end
end
