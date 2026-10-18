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
      bairro_ajustes: {
        Row: {
          bairro: string
          diaria: number
          fonte: string
          id: string
          ocupacao: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          bairro: string
          diaria: number
          fonte: string
          id?: string
          ocupacao: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          bairro?: string
          diaria?: number
          fonte?: string
          id?: string
          ocupacao?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      guide_events: {
        Row: {
          created_at: string | null
          device_type: string | null
          event_data: Json | null
          event_type: string
          id: string
          page: string | null
          session_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_type?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          page?: string | null
          session_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_type?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          page?: string | null
          session_id?: string | null
        }
        Relationships: []
      }
      guide_leads: {
        Row: {
          area_sqm: string | null
          created_at: string | null
          id: string
          name: string
          neighborhood: string | null
          objective: string | null
          session_id: string | null
          source: string | null
          user_id: string | null
          whatsapp: string
        }
        Insert: {
          area_sqm?: string | null
          created_at?: string | null
          id?: string
          name: string
          neighborhood?: string | null
          objective?: string | null
          session_id?: string | null
          source?: string | null
          user_id?: string | null
          whatsapp: string
        }
        Update: {
          area_sqm?: string | null
          created_at?: string | null
          id?: string
          name?: string
          neighborhood?: string | null
          objective?: string | null
          session_id?: string | null
          source?: string | null
          user_id?: string | null
          whatsapp?: string
        }
        Relationships: []
      }
      ota_calendar_events: {
        Row: {
          connection_id: string
          end_date: string
          external_event_uid: string | null
          id: string
          raw_payload: Json | null
          start_date: string
          summary: string | null
          synced_at: string
        }
        Insert: {
          connection_id: string
          end_date: string
          external_event_uid?: string | null
          id?: string
          raw_payload?: Json | null
          start_date: string
          summary?: string | null
          synced_at?: string
        }
        Update: {
          connection_id?: string
          end_date?: string
          external_event_uid?: string | null
          id?: string
          raw_payload?: Json | null
          start_date?: string
          summary?: string | null
          synced_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ota_calendar_events_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "ota_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      ota_connections: {
        Row: {
          connection_type: string
          created_at: string
          external_listing_id: string | null
          ical_url: string | null
          id: string
          is_test: boolean
          last_synced_at: string | null
          project_id: string
          provider: string
          status: string
        }
        Insert: {
          connection_type?: string
          created_at?: string
          external_listing_id?: string | null
          ical_url?: string | null
          id?: string
          is_test?: boolean
          last_synced_at?: string | null
          project_id: string
          provider?: string
          status?: string
        }
        Update: {
          connection_type?: string
          created_at?: string
          external_listing_id?: string | null
          ical_url?: string | null
          id?: string
          is_test?: boolean
          last_synced_at?: string | null
          project_id?: string
          provider?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ota_connections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_assumptions: {
        Row: {
          adr: number | null
          area_sqm: string | null
          cleaning_per_stay: number | null
          condo_monthly: number | null
          created_at: string
          id: string
          management_pct: number | null
          neighborhood: string | null
          project_id: string
          property_value: number | null
          taxes_pct: number | null
          updated_at: string
        }
        Insert: {
          adr?: number | null
          area_sqm?: string | null
          cleaning_per_stay?: number | null
          condo_monthly?: number | null
          created_at?: string
          id?: string
          management_pct?: number | null
          neighborhood?: string | null
          project_id: string
          property_value?: number | null
          taxes_pct?: number | null
          updated_at?: string
        }
        Update: {
          adr?: number | null
          area_sqm?: string | null
          cleaning_per_stay?: number | null
          condo_monthly?: number | null
          created_at?: string
          id?: string
          management_pct?: number | null
          neighborhood?: string | null
          project_id?: string
          property_value?: number | null
          taxes_pct?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      project_scenarios: {
        Row: {
          adr: number | null
          area_sqm: string | null
          avg_stay_nights: number | null
          cleaning_per_stay: number | null
          condo_monthly: number | null
          created_at: string
          id: string
          kind: string
          management_pct: number | null
          name: string
          neighborhood: string | null
          occupancy_pct: number | null
          position: number
          project_id: string
          property_value: number | null
          taxes_pct: number | null
          updated_at: string
        }
        Insert: {
          adr?: number | null
          area_sqm?: string | null
          avg_stay_nights?: number | null
          cleaning_per_stay?: number | null
          condo_monthly?: number | null
          created_at?: string
          id?: string
          kind?: string
          management_pct?: number | null
          name: string
          neighborhood?: string | null
          occupancy_pct?: number | null
          position?: number
          project_id: string
          property_value?: number | null
          taxes_pct?: number | null
          updated_at?: string
        }
        Update: {
          adr?: number | null
          area_sqm?: string | null
          avg_stay_nights?: number | null
          cleaning_per_stay?: number | null
          condo_monthly?: number | null
          created_at?: string
          id?: string
          kind?: string
          management_pct?: number | null
          name?: string
          neighborhood?: string | null
          occupancy_pct?: number | null
          position?: number
          project_id?: string
          property_value?: number | null
          taxes_pct?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_scenarios_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      radar_coleta_auditoria: {
        Row: {
          autor_nome: string
          id: string
          observacao_id: string
          registrado_em: string
          registrado_por: string
          utms: Json
        }
        Insert: {
          autor_nome: string
          id?: string
          observacao_id: string
          registrado_em?: string
          registrado_por: string
          utms?: Json
        }
        Update: {
          autor_nome?: string
          id?: string
          observacao_id?: string
          registrado_em?: string
          registrado_por?: string
          utms?: Json
        }
        Relationships: [
          {
            foreignKeyName: "radar_coleta_auditoria_observacao_id_fkey"
            columns: ["observacao_id"]
            isOneToOne: true
            referencedRelation: "radar_bairro_atual"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "radar_coleta_auditoria_observacao_id_fkey"
            columns: ["observacao_id"]
            isOneToOne: true
            referencedRelation: "radar_observacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      radar_coletas_pendentes: {
        Row: {
          amostra_n: number
          atual: Json | null
          bairro: string
          cidade: string
          coletado_em: string
          criado_em: string
          decidido_em: string | null
          decidido_por: string | null
          fonte_id: string
          id: string
          indicadores: Json
          motivo: string | null
          periodo_fim: string
          periodo_inicio: string
          publicado_em: string | null
          status: string
          url_origem: string
        }
        Insert: {
          amostra_n: number
          atual?: Json | null
          bairro: string
          cidade?: string
          coletado_em: string
          criado_em?: string
          decidido_em?: string | null
          decidido_por?: string | null
          fonte_id: string
          id?: string
          indicadores: Json
          motivo?: string | null
          periodo_fim: string
          periodo_inicio: string
          publicado_em?: string | null
          status?: string
          url_origem: string
        }
        Update: {
          amostra_n?: number
          atual?: Json | null
          bairro?: string
          cidade?: string
          coletado_em?: string
          criado_em?: string
          decidido_em?: string | null
          decidido_por?: string | null
          fonte_id?: string
          id?: string
          indicadores?: Json
          motivo?: string | null
          periodo_fim?: string
          periodo_inicio?: string
          publicado_em?: string | null
          status?: string
          url_origem?: string
        }
        Relationships: [
          {
            foreignKeyName: "radar_coletas_pendentes_fonte_id_fkey"
            columns: ["fonte_id"]
            isOneToOne: false
            referencedRelation: "radar_fontes"
            referencedColumns: ["id"]
          },
        ]
      }
      radar_fontes: {
        Row: {
          id: string
          metodologia_declarada: boolean
          nome: string
          observacao: string | null
          tipo: string
          url: string | null
        }
        Insert: {
          id: string
          metodologia_declarada?: boolean
          nome: string
          observacao?: string | null
          tipo: string
          url?: string | null
        }
        Update: {
          id?: string
          metodologia_declarada?: boolean
          nome?: string
          observacao?: string | null
          tipo?: string
          url?: string | null
        }
        Relationships: []
      }
      radar_observacao_revisoes: {
        Row: {
          anterior: Json
          id: string
          observacao_id: string
          registrado_em: string
          registrado_por: string
        }
        Insert: {
          anterior: Json
          id?: string
          observacao_id: string
          registrado_em?: string
          registrado_por: string
        }
        Update: {
          anterior?: Json
          id?: string
          observacao_id?: string
          registrado_em?: string
          registrado_por?: string
        }
        Relationships: [
          {
            foreignKeyName: "radar_observacao_revisoes_observacao_id_fkey"
            columns: ["observacao_id"]
            isOneToOne: false
            referencedRelation: "radar_bairro_atual"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "radar_observacao_revisoes_observacao_id_fkey"
            columns: ["observacao_id"]
            isOneToOne: false
            referencedRelation: "radar_observacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      radar_observacoes: {
        Row: {
          amostra_n: number | null
          ativo: boolean
          bairro: string
          cidade: string
          coletado_em: string
          created_at: string
          fonte_id: string
          id: string
          indicador: string
          observacao: string | null
          periodo_fim: string | null
          periodo_inicio: string | null
          publicado_em: string | null
          unidade: string
          url_origem: string | null
          valor: number
        }
        Insert: {
          amostra_n?: number | null
          ativo?: boolean
          bairro: string
          cidade?: string
          coletado_em: string
          created_at?: string
          fonte_id: string
          id?: string
          indicador: string
          observacao?: string | null
          periodo_fim?: string | null
          periodo_inicio?: string | null
          publicado_em?: string | null
          unidade: string
          url_origem?: string | null
          valor: number
        }
        Update: {
          amostra_n?: number | null
          ativo?: boolean
          bairro?: string
          cidade?: string
          coletado_em?: string
          created_at?: string
          fonte_id?: string
          id?: string
          indicador?: string
          observacao?: string | null
          periodo_fim?: string | null
          periodo_inicio?: string | null
          publicado_em?: string | null
          unidade?: string
          url_origem?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "radar_observacoes_fonte_id_fkey"
            columns: ["fonte_id"]
            isOneToOne: false
            referencedRelation: "radar_fontes"
            referencedColumns: ["id"]
          },
        ]
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
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      radar_bairro_atual: {
        Row: {
          amostra_n: number | null
          bairro: string | null
          cidade: string | null
          coletado_em: string | null
          confianca: string | null
          fonte_id: string | null
          fonte_nome: string | null
          fonte_tipo: string | null
          fonte_url: string | null
          id: string | null
          idade_dias: number | null
          indicador: string | null
          metodologia_declarada: boolean | null
          observacao: string | null
          periodo_fim: string | null
          periodo_inicio: string | null
          publicado_em: string | null
          unidade: string | null
          url_origem: string | null
          valor: number | null
        }
        Relationships: [
          {
            foreignKeyName: "radar_observacoes_fonte_id_fkey"
            columns: ["fonte_id"]
            isOneToOne: false
            referencedRelation: "radar_fontes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_aprovar_coleta_pendente: { Args: { p_id: string }; Returns: number }
      admin_ativar_coleta_radar: { Args: { p_id: string }; Returns: undefined }
      admin_descartar_coleta_pendente: {
        Args: { p_id: string; p_motivo?: string }
        Returns: undefined
      }
      admin_editar_observacao_radar: {
        Args: {
          p_esperado: string
          p_id: string
          p_observacao: string
          p_url: string
          p_valor: number
        }
        Returns: undefined
      }
      admin_lead_scores: {
        Args: never
        Returns: {
          area_sqm: string
          assumption_adr: number
          chatbot_interactions: number
          created_at: string
          cta_clicks: number
          event_count: number
          exported_simulation: boolean
          has_account: boolean
          has_assumptions: boolean
          last_event_at: string
          lead_id: string
          max_scroll: number
          name: string
          neighborhood: string
          objective: string
          project_count: number
          property_value: number
          quiz_interactions: number
          sections_viewed: number
          session_id: string
          simulator_uses: number
          source: string
          stage: string
          stage_entered_at: string
          user_id: string
          whatsapp: string
        }[]
      }
      admin_registrar_coleta_radar: {
        Args: { p_coleta: Json }
        Returns: number
      }
      admin_registrar_coleta_radar_auditada: {
        Args: { p_coleta: Json; p_utms?: Json }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_owns_ota_connection: {
        Args: { _connection_id: string; _user_id: string }
        Returns: boolean
      }
      user_owns_project: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
