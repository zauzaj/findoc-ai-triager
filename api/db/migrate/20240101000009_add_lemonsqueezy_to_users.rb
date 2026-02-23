class AddLemonsqueezyToUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :users, :ls_subscription_id,     :string
    add_column :users, :ls_subscription_status,  :string

    add_index :users, :ls_subscription_id
  end
end
