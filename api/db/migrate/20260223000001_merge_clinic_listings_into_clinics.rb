class MergeClinicListingsIntoClinics < ActiveRecord::Migration[7.2]
  def up
    rename_table :clinic_listings, :clinics if table_exists?(:clinic_listings)

    if column_exists?(:clinics, :google_place_id)
      rename_column :clinics, :google_place_id, :place_id
    end

    if column_exists?(:clinics, :claimed_by_id)
      rename_column :clinics, :claimed_by_id, :claimed_by_user_id
    end

    if column_exists?(:clinics, :status)
      rename_column :clinics, :status, :claim_status
    end

    add_column :clinics, :subscription_status, :string, null: false, default: "none" unless column_exists?(:clinics, :subscription_status)
    add_column :clinics, :subscription_started_at, :datetime unless column_exists?(:clinics, :subscription_started_at)
    add_column :clinics, :subscription_expires_at, :datetime unless column_exists?(:clinics, :subscription_expires_at)
    add_column :clinics, :featured_enabled, :boolean, null: false, default: false unless column_exists?(:clinics, :featured_enabled)
    add_column :clinics, :enhanced_profile_enabled, :boolean, null: false, default: false unless column_exists?(:clinics, :enhanced_profile_enabled)
    add_column :clinics, :short_description, :text unless column_exists?(:clinics, :short_description)
    add_column :clinics, :verified_insurance_badge, :boolean, null: false, default: false unless column_exists?(:clinics, :verified_insurance_badge)

    execute <<~SQL
      UPDATE clinics
      SET claim_status = CASE claim_status
        WHEN 'claimed_active' THEN 'claimed'
        WHEN 'claimed_expired' THEN 'claimed'
        ELSE 'unclaimed'
      END
    SQL

    execute <<~SQL
      UPDATE clinics
      SET subscription_status = CASE
        WHEN claim_status = 'claimed' THEN 'active'
        ELSE 'none'
      END
    SQL

    execute <<~SQL
      UPDATE clinics
      SET featured_enabled = (subscription_status = 'active'),
          enhanced_profile_enabled = (subscription_status = 'active')
    SQL

    remove_column :clinics, :custom_description if column_exists?(:clinics, :custom_description)
    remove_column :clinics, :custom_photos if column_exists?(:clinics, :custom_photos)
    remove_column :clinics, :booking_url if column_exists?(:clinics, :booking_url)
    remove_column :clinics, :phone_override if column_exists?(:clinics, :phone_override)
    remove_column :clinics, :website_override if column_exists?(:clinics, :website_override)
    remove_column :clinics, :specialties if column_exists?(:clinics, :specialties)
    remove_column :clinics, :languages_spoken if column_exists?(:clinics, :languages_spoken)
    remove_column :clinics, :accepted_insurance if column_exists?(:clinics, :accepted_insurance)
    remove_column :clinics, :lemon_squeezy_subscription_id if column_exists?(:clinics, :lemon_squeezy_subscription_id)

    change_column_null :clinics, :place_id, false
    change_column_default :clinics, :claim_status, from: "unclaimed", to: "unclaimed"

    remove_index :clinics, :google_place_id if index_exists?(:clinics, :google_place_id)
    add_index :clinics, :place_id, unique: true unless index_exists?(:clinics, :place_id, unique: true)

    remove_index :clinics, :status if index_exists?(:clinics, :status)
    add_index :clinics, :claim_status unless index_exists?(:clinics, :claim_status)
    add_index :clinics, :subscription_status unless index_exists?(:clinics, :subscription_status)

    if foreign_key_exists?(:clinics, :users, column: :claimed_by_id)
      remove_foreign_key :clinics, column: :claimed_by_id
      add_foreign_key :clinics, :users, column: :claimed_by_user_id
    elsif !foreign_key_exists?(:clinics, :users, column: :claimed_by_user_id)
      add_foreign_key :clinics, :users, column: :claimed_by_user_id
    end
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
