FROM ruby:3.3-alpine

RUN apk add --no-cache \
      build-base \
      yaml-dev \
      postgresql-dev \
      postgresql-client \
      tzdata \
      bash \
      curl

WORKDIR /rails

COPY Gemfile Gemfile.lock ./
RUN bundle install --jobs 4 --retry 3

COPY . .

RUN bundle exec bootsnap precompile app/ lib/

EXPOSE 3001

CMD ["bundle", "exec", "rails", "server", "-b", "0.0.0.0", "-p", "3001"]
