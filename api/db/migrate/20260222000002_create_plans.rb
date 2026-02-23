class CreatePlans < ActiveRecord::Migration[7.2]
  def change
    create_table :plans do |t|
      t.string  :slug,                null: false   # 'free', 'premium'
      t.string  :name,                null: false   # 'Free', 'Premium'
      t.integer :price_aed_cents,     null: false, default: 0   # 1899 = AED 18.99
      # 0 means unlimited
      t.integer :nav_limit_monthly,   null: false, default: 3
      t.integer :result_limit,        null: false, default: 10
      # Feature flags
      t.boolean :can_save_doctors,    null: false, default: false
      t.boolean :can_view_history,    null: false, default: false
      # LemonSqueezy variant ID for checkout
      t.string  :ls_variant_id
      t.boolean :active,              null: false, default: true
      t.timestamps
    end

    add_index :plans, :slug,         unique: true
    add_index :plans, :ls_variant_id, unique: true, where: "ls_variant_id IS NOT NULL"
  end
end
