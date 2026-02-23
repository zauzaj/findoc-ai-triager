module Api
  module V1
    class SavedPlacesController < ApplicationController
      before_action :authenticate!

      def index
        saved = current_user.saved_places.order(created_at: :desc)
        render json: { saved_places: saved.map { |s| saved_json(s) } }
      end

      def create
        saved = SavedPlace.find_or_create_by!(
          user: current_user, google_place_id: params[:place_id]
        ) { |sp| sp.specialty = params[:specialty]; sp.notes = params[:notes] }
        render json: { saved_place: saved_json(saved) }, status: :created
      end

      def destroy
        saved = current_user.saved_places.find_by!(google_place_id: params[:place_id])
        saved.destroy!
        render json: { ok: true }
      end

      private

      def saved_json(s)
        { id: s.id, google_place_id: s.google_place_id, specialty: s.specialty,
          notes: s.notes, saved_at: s.created_at }
      end
    end
  end
end
