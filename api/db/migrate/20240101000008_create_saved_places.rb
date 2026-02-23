class CreateSavedPlaces < ActiveRecord::Migration[7.2]
  def change
    create_table :saved_places do |t|
      t.references :user,           null: false, foreign_key: true
      t.string     :google_place_id, null: false
      t.string     :specialty
      t.text       :notes
      t.timestamps
    end
    add_index :saved_places, %i[user_id google_place_id], unique: true
  end
end
