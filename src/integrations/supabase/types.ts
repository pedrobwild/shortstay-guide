export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bairro_airbnb_sp: {
        Row: {
          adr_medio_studio: number | null
          aluguel_mensal_long_term_medio: number | null
          area_media_estudio: number
          bairro: string
          cidade: string
          data_atualizacao: string
          delta_yield: number | null
          dias_medio_venda_imovel: number | null
          estadia_media_noites: number | null
          fonte_primaria: string | null
          grau_saturacao_index: number | null
          id: number
          indice_criminalidade: number | null
          media_reviews_por_listing: number | null
          n_listings_studio_1q: number
          n_listings_total: number
          nivel_confianca_dados: string
          numero_transacoes_imobiliarias_ano: number | null
          ocupacao_media_studio: number | null
          pct_politica_flexivel: number | null
          pct_politica_moderada: number | null
          pct_politica_rigida: number | null
          pct_studio_1q: number
          percentual_superhost: number | null
          periodo_fim: string
          periodo_inicio: string
          porcentagem_reservas_30d_plus: number | null
          preco_m2_residencial_medio: number | null
          rating_medio: number | null
          receita_anual_media_studio: number | null
          risco_condominio: number | null
          risco_regulatorio: number | null
          score_crescimento_potencial: number | null
          score_liquidez: number | null
          score_rentabilidade: number | null
          yield_bruto_airbnb: number | null
          yield_bruto_long_term: number | null
        }
        Insert: {
          adr_medio_studio?: number | null
          aluguel_mensal_long_term_medio?: number | null
          area_media_estudio?: number
          bairro: string
          cidade?: string
          data_atualizacao?: string
          delta_yield?: number | null
          dias_medio_venda_imovel?: number | null
          estadia_media_noites?: number | null
          fonte_primaria?: string | null
          grau_saturacao_index?: number | null
          id?: number
          indice_criminalidade?: number | null
          media_reviews_por_listing?: number | null
          n_listings_studio_1q: number
          n_listings_total: number
          nivel_confianca_dados: string
          numero_transacoes_imobiliarias_ano?: number | null
          ocupacao_media_studio?: number | null
          pct_politica_flexivel?: number | null
          pct_politica_moderada?: number | null
          pct_politica_rigida?: number | null
          pct_studio_1q: number
          percentual_superhost?: number | null
          periodo_fim: string
          periodo_inicio: string
          porcentagem_reservas_30d_plus?: number | null
          preco_m2_residencial_medio?: number | null
          rating_medio?: number | null
          receita_anual_media_studio?: number | null
          risco_condominio?: number | null
          risco_regulatorio?: number | null
          score_crescimento_potencial?: number | null
          score_liquidez?: number | null
          score_rentabilidade?: number | null
          yield_bruto_airbnb?: number | null
          yield_bruto_long_term?: number | null
        }
        Update: {
          adr_medio_studio?: number | null
          aluguel_mensal_long_term_medio?: number | null
          area_media_estudio?: number
          bairro?: string
          cidade?: string
          data_atualizacao?: string
          delta_yield?: number | null
          dias_medio_venda_imovel?: number | null
          estadia_media_noites?: number | null
          fonte_primaria?: string | null
          grau_saturacao_index?: number | null
          id?: number
          indice_criminalidade?: number | null
          media_reviews_por_listing?: number | null
          n_listings_studio_1q?: number
          n_listings_total?: number
          nivel_confianca_dados?: string
          numero_transacoes_imobiliarias_ano?: number | null
          ocupacao_media_studio?: number | null
          pct_politica_flexivel?: number | null
          pct_politica_moderada?: number | null
          pct_politica_rigida?: number | null
          pct_studio_1q?: number
          percentual_superhost?: number | null
          periodo_fim?: string
          periodo_inicio?: string
          porcentagem_reservas_30d_plus?: number | null
          preco_m2_residencial_medio?: number | null
          rating_medio?: number | null
          receita_anual_media_studio?: number | null
          risco_condominio?: number | null
          risco_regulatorio?: number | null
          score_crescimento_potencial?: number | null
          score_liquidez?: number | null
          score_rentabilidade?: number | null
          yield_bruto_airbnb?: number | null
          yield_bruto_long_term?: number | null
        }
        Relationships: []
      }
      raw_listings: {
        Row: {
          adr_estimado: number | null
          amenities: Json | null
          area_m2: number | null
          bairro: string
          bathrooms: number | null
          bedrooms: number | null
          beds: number | null
          capacidade_hospedes: number | null
          cidade: string
          data_coleta: string
          data_primeira_reserva: string | null
          descricao_resumida: string | null
          disponibilidade_30d: number | null
          disponibilidade_365d: number | null
          disponibilidade_90d: number | null
          estadia_media_noites: number | null
          fonte: string
          is_superhost: boolean | null
          latitude: number | null
          listing_id: string
          longitude: number | null
          max_noites: number | null
          min_noites: number | null
          moeda: string
          n_reviews: number | null
          ocupacao_estimada: number | null
          politica_cancelamento: string | null
          preco_noite_atual: number | null
          rating_geral: number | null
          receita_anual_estimada: number | null
          regras_casa_texto: string | null
          titulo: string | null
          unit_type: string
          url: string
        }
        Insert: {
          adr_estimado?: number | null
          amenities?: Json | null
          area_m2?: number | null
          bairro: string
          bathrooms?: number | null
          bedrooms?: number | null
          beds?: number | null
          capacidade_hospedes?: number | null
          cidade?: string
          data_coleta?: string
          data_primeira_reserva?: string | null
          descricao_resumida?: string | null
          disponibilidade_30d?: number | null
          disponibilidade_365d?: number | null
          disponibilidade_90d?: number | null
          estadia_media_noites?: number | null
          fonte: string
          is_superhost?: boolean | null
          latitude?: number | null
          listing_id: string
          longitude?: number | null
          max_noites?: number | null
          min_noites?: number | null
          moeda?: string
          n_reviews?: number | null
          ocupacao_estimada?: number | null
          politica_cancelamento?: string | null
          preco_noite_atual?: number | null
          rating_geral?: number | null
          receita_anual_estimada?: number | null
          regras_casa_texto?: string | null
          titulo?: string | null
          unit_type?: string
          url: string
        }
        Update: {
          adr_estimado?: number | null
          amenities?: Json | null
          area_m2?: number | null
          bairro?: string
          bathrooms?: number | null
          bedrooms?: number | null
          beds?: number | null
          capacidade_hospedes?: number | null
          cidade?: string
          data_coleta?: string
          data_primeira_reserva?: string | null
          descricao_resumida?: string | null
          disponibilidade_30d?: number | null
          disponibilidade_365d?: number | null
          disponibilidade_90d?: number | null
          estadia_media_noites?: number | null
          fonte?: string
          is_superhost?: boolean | null
          latitude?: number | null
          listing_id?: string
          longitude?: number | null
          max_noites?: number | null
          min_noites?: number | null
          moeda?: string
          n_reviews?: number | null
          ocupacao_estimada?: number | null
          politica_cancelamento?: string | null
          preco_noite_atual?: number | null
          rating_geral?: number | null
          receita_anual_estimada?: number | null
          regras_casa_texto?: string | null
          titulo?: string | null
          unit_type?: string
          url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
