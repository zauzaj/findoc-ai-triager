class CreateAnalyticsEvents < ActiveRecord::Migration[7.2]
  def change
    create_table :analytics_events do |t|
      t.string  :event_name,   null: false
      t.string  :anonymous_id
      t.bigint  :user_id
      t.string  :language,     default: "en"
      t.jsonb   :properties,   null: false, default: {}
      t.timestamps
    end

    add_index :analytics_events, :event_name
    add_index :analytics_events, :user_id
    add_index :analytics_events, :anonymous_id
    add_index :analytics_events, :created_at
    add_index :analytics_events, :properties, using: :gin
  end
end
