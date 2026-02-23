class AddPlaceIdToAnalyticsEvents < ActiveRecord::Migration[7.2]
  def change
    # Google Place ID — null for non-clinic events (auth, upgrade, etc.)
    # First-class column so we can JOIN to clinic data and compute per-clinic metrics
    # without parsing JSONB.
    add_column :analytics_events, :place_id, :string

    add_index :analytics_events, :place_id, where: "place_id IS NOT NULL"
    # Composite index answers: "all events for this clinic, by event type"
    add_index :analytics_events, [:place_id, :event_name], where: "place_id IS NOT NULL"
  end
end
