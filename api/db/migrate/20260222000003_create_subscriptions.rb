class CreateSubscriptions < ActiveRecord::Migration[7.2]
  def change
    create_table :subscriptions do |t|
      t.references :user, null: false, foreign_key: true, index: true
      t.references :plan, null: false, foreign_key: true, index: true

      # LemonSqueezy identifiers
      t.string  :ls_subscription_id,   index: { unique: true }
      t.string  :ls_customer_id

      # Subscription lifecycle
      t.string  :status,               null: false, default: "active"
      # active | trialing | paused | cancelled | expired | past_due

      # Billing window
      t.datetime :current_period_start
      t.datetime :current_period_end
      t.datetime :trial_ends_at
      t.datetime :cancelled_at    # when user requested cancellation
      t.datetime :expires_at      # when access actually ends post-cancellation
      t.integer  :billing_day     # day-of-month the subscription renews (for proration)

      # Raw webhook payload — lets us re-derive anything without schema changes
      t.jsonb :metadata, null: false, default: {}

      t.timestamps
    end

    add_index :subscriptions, :ls_customer_id
    add_index :subscriptions, :status
    add_index :subscriptions, [:user_id, :status]
    add_index :subscriptions, :current_period_end
    add_index :subscriptions, :metadata, using: :gin
  end
end
