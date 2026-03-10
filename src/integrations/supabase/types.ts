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
      avisos: {
        Row: {
          created_at: string
          data_validade: string
          id: string
          texto: string
          titulo: string
        }
        Insert: {
          created_at?: string
          data_validade: string
          id?: string
          texto: string
          titulo: string
        }
        Update: {
          created_at?: string
          data_validade?: string
          id?: string
          texto?: string
          titulo?: string
        }
        Relationships: []
      }
      checkins: {
        Row: {
          created_at: string
          data_hora: string
          escala_id: string
          id: string
          observacao: string | null
          tipo: Database["public"]["Enums"]["checkin_tipo"]
        }
        Insert: {
          created_at?: string
          data_hora?: string
          escala_id: string
          id?: string
          observacao?: string | null
          tipo: Database["public"]["Enums"]["checkin_tipo"]
        }
        Update: {
          created_at?: string
          data_hora?: string
          escala_id?: string
          id?: string
          observacao?: string | null
          tipo?: Database["public"]["Enums"]["checkin_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "checkins_escala_id_fkey"
            columns: ["escala_id"]
            isOneToOne: false
            referencedRelation: "escalas"
            referencedColumns: ["id"]
          },
        ]
      }
      escalas: {
        Row: {
          created_at: string
          data: string
          funcionario_id: string
          id: string
          posto_id: string
          status: Database["public"]["Enums"]["escala_status"]
          turno_id: string
        }
        Insert: {
          created_at?: string
          data: string
          funcionario_id: string
          id?: string
          posto_id: string
          status?: Database["public"]["Enums"]["escala_status"]
          turno_id: string
        }
        Update: {
          created_at?: string
          data?: string
          funcionario_id?: string
          id?: string
          posto_id?: string
          status?: Database["public"]["Enums"]["escala_status"]
          turno_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "escalas_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalas_posto_id_fkey"
            columns: ["posto_id"]
            isOneToOne: false
            referencedRelation: "postos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalas_turno_id_fkey"
            columns: ["turno_id"]
            isOneToOne: false
            referencedRelation: "turnos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_folga: {
        Row: {
          created_at: string
          datas: string[]
          funcionario_id: string
          id: string
          motivo: string
          status: Database["public"]["Enums"]["folga_status"]
        }
        Insert: {
          created_at?: string
          datas: string[]
          funcionario_id: string
          id?: string
          motivo: string
          status?: Database["public"]["Enums"]["folga_status"]
        }
        Update: {
          created_at?: string
          datas?: string[]
          funcionario_id?: string
          id?: string
          motivo?: string
          status?: Database["public"]["Enums"]["folga_status"]
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_folga_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      postos: {
        Row: {
          created_at: string
          dia_pagamento: number | null
          endereco: string
          id: string
          nome_cliente: string
          observacoes: string | null
          tipo_servico: string
          valor_mensal: number | null
        }
        Insert: {
          created_at?: string
          dia_pagamento?: number | null
          endereco: string
          id?: string
          nome_cliente: string
          observacoes?: string | null
          tipo_servico?: string
          valor_mensal?: number | null
        }
        Update: {
          created_at?: string
          dia_pagamento?: number | null
          endereco?: string
          id?: string
          nome_cliente?: string
          observacoes?: string | null
          tipo_servico?: string
          valor_mensal?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ativo: boolean
          cpf: string | null
          created_at: string
          dados_pagamento: string | null
          funcao: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cpf?: string | null
          created_at?: string
          dados_pagamento?: string | null
          funcao?: string | null
          id: string
          nome: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cpf?: string | null
          created_at?: string
          dados_pagamento?: string | null
          funcao?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      turnos: {
        Row: {
          created_at: string
          hora_fim: string
          hora_inicio: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          hora_fim: string
          hora_inicio: string
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          hora_fim?: string
          hora_inicio?: string
          id?: string
          nome?: string
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
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "funcionario"
      checkin_tipo: "checkin" | "checkout"
      escala_status:
        | "planejado"
        | "confirmado"
        | "concluido"
        | "falta"
        | "precisa_cobertura"
      folga_status: "pendente" | "aprovado" | "rejeitado"
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
    Enums: {
      app_role: ["admin", "funcionario"],
      checkin_tipo: ["checkin", "checkout"],
      escala_status: [
        "planejado",
        "confirmado",
        "concluido",
        "falta",
        "precisa_cobertura",
      ],
      folga_status: ["pendente", "aprovado", "rejeitado"],
    },
  },
} as const
