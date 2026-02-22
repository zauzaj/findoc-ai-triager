class AddPlanRefToUsers < ActiveRecord::Migration[7.2]
  def change
    # FK to plans — the user's current effective plan.
    # Kept denormalized on users for O(1) plan checks without a JOIN.
    # Updated by webhooks and backfilled below.
    add_column :users, :current_plan_id, :bigint

    add_foreign_key :users, :plans, column: :current_plan_id
    add_index :users, :current_plan_id

    # Backfill current_plan_id from the existing string `plan` column.
    # Runs after CreatePlans seeds data via a reversible up block.
    reversible do |dir|
      dir.up do
        execute <<~SQL
          UPDATE users
          SET    current_plan_id = plans.id
          FROM   plans
          WHERE  plans.slug = users.plan
        SQL
      end
    end
  end
end
