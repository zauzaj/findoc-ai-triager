class SendMagicLinkEmailJob < ApplicationJob
  queue_as :mailers

  retry_on Net::OpenTimeout, Net::ReadTimeout, Timeout::Error, wait: :exponentially_longer, attempts: 5
  retry_on Errno::ECONNRESET, Errno::ECONNREFUSED, wait: :exponentially_longer, attempts: 5

  def perform(user_id, magic_url)
    user = User.find_by(id: user_id)
    return unless user

    MagicLinkMailer.with(user: user, magic_url: magic_url).magic_link_email.deliver_now
  end
end
