Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins(
      ENV.fetch("WEB_URL", "http://localhost:3000"),
      "http://localhost:3000",
      /\Ahttps:\/\/.*\.herokuapp\.com\z/
    )
    resource "*",
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      expose: ["Authorization"]
  end
end
