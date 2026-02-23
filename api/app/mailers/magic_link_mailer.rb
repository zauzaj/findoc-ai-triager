class MagicLinkMailer < ApplicationMailer
  def magic_link_email
    @user = params[:user]
    @magic_url = params[:magic_url]

    mail(to: @user.email, subject: "Your Findoc sign-in link")
  end
end
