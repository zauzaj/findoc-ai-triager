class CreateUsers < ActiveRecord::Migration[7.2]
  def change
    create_table :users do |t|
      t.string  :email,                   null: false
      t.string  :name
      t.string  :provider,                null: false, default: "email"
      t.string  :provider_uid
      t.string  :avatar_url
      t.string  :plan,                    null: false, default: "free"
      t.string  :locale,                  null: false, default: "en"
      t.string  :insurance_provider
      t.float   :latitude
      t.float   :longitude
      t.string  :emirate
      t.integer :navigations_this_month,  null: false, default: 0
      t.datetime :navigations_reset_at
      t.string  :magic_link_token
      t.datetime :magic_link_expires_at
      t.timestamps
    end
    add_index :users, :email,                          unique: true
    add_index :users, %i[provider provider_uid],       unique: true, name: "idx_users_provider_uid"
    add_index :users, :magic_link_token,               unique: true
  end
end
