export type ElectionStatus =
  'draft' | 'scheduled' | 'open' | 'paused' | 'closed' | 'tallied' | 'archived'
export type VoterStatus = 'active' | 'inactive' | 'blocked'
export type AdminRole = 'super_admin' | 'election_admin' | 'commission' | 'poll_worker'

export interface Company {
  id: string
  name: string
  cnpj: string | null
  address: string | null
  city: string | null
  state: string | null
  created_at: string
  updated_at: string
}

export interface Election {
  id: string
  company_id: string | null
  slug: string
  title: string
  management_period: string
  voting_date: string
  voting_start: string
  voting_end: string
  status: ElectionStatus
  total_employees: number
  titulares_count: number
  suplentes_count: number
  allow_blank_vote: boolean
  show_results_only_after_close: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Candidate {
  id: string
  election_id: string
  display_order: number
  name: string
  role: string
  slogan: string | null
  photo_url: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface Voter {
  id: string
  election_id: string
  name: string
  cpf_hash: string
  cpf_last2: string | null
  cpf_masked: string | null
  department: string | null
  role: string | null
  registration_number: string | null
  status: VoterStatus
  has_voted: boolean
  voted_at: string | null
  attendance_token: string | null
  created_at: string
  updated_at: string
}

/** Intentionally contains no voter identifier. Keep this boundary strict. */
export interface Vote {
  id: string
  election_id: string
  candidate_id: string | null
  is_blank: boolean
  created_at: string
}

export interface AdminUser {
  id: string
  full_name: string
  email: string
  role: AdminRole
  active: boolean
  created_at: string
}

export interface AuditLog {
  id: string
  election_id: string | null
  actor_id: string | null
  action: string
  details: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface PublicElection {
  id: string
  slug: string
  title: string
  company_name: string | null
  management_period: string
  voting_date: string
  voting_start: string
  voting_end: string
  status: ElectionStatus
  allow_blank_vote: boolean
}

export interface VoterAccessResult {
  allowed: boolean
  reason: string
  election_id: string | null
  election_title: string | null
  company_name: string | null
  management_period: string | null
  voting_date: string | null
  allow_blank_vote: boolean
  voter_name: string | null
  cpf_masked: string | null
  department: string | null
  role: string | null
}

export interface PublicCandidate {
  id: string
  name: string
  role: string
  slogan: string | null
  photo_url: string | null
  display_order: number
}

export type ResultStatus = 'Titular' | 'Suplente' | 'Candidato votado não eleito'

export interface TallyCandidate {
  candidate_id: string
  candidate_name: string
  candidate_role: string
  display_order: number
  votes_count: number
  rank_position: number
  result_status: ResultStatus
}

export interface ElectionTally {
  election_id: string
  title: string
  company_name: string | null
  company_cnpj: string | null
  management_period: string
  voting_date: string
  voting_start: string
  voting_end: string
  total_active_voters: number
  total_attendance: number
  total_votes: number
  blank_votes: number
  participation_percentage: number
  has_tie: boolean
  has_divergence: boolean
  candidates: TallyCandidate[]
}

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: Company
        Insert: Omit<Company, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Company>
        Relationships: []
      }
      elections: {
        Row: Election
        Insert: Omit<Election, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Election>
        Relationships: []
      }
      candidates: {
        Row: Candidate
        Insert: Omit<Candidate, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Candidate>
        Relationships: []
      }
      voters: {
        Row: Voter
        Insert: Omit<Voter, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Voter>
        Relationships: []
      }
      votes: {
        Row: Vote
        Insert: Omit<Vote, 'id' | 'created_at'>
        Update: never
        Relationships: []
      }
      admin_users: {
        Row: AdminUser
        Insert: AdminUser
        Update: Partial<AdminUser>
        Relationships: []
      }
      audit_logs: {
        Row: AuditLog
        Insert: Omit<AuditLog, 'id' | 'created_at'>
        Update: never
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      cast_vote: {
        Args: {
          p_election_slug: string
          p_cpf_hash: string
          p_candidate_id: string | null
          p_is_blank: boolean
        }
        Returns: { success: boolean; message: string }
      }
      transition_election_status: {
        Args: { p_election_id: string; p_target_status: ElectionStatus }
        Returns: string
      }
      get_public_election: {
        Args: { p_election_slug: string }
        Returns: PublicElection
      }
      verify_voter_access: {
        Args: { p_election_slug: string; p_cpf_hash: string }
        Returns: VoterAccessResult
      }
      get_active_candidates: {
        Args: { p_election_slug: string }
        Returns: PublicCandidate[]
      }
      get_election_tally: {
        Args: { p_election_id: string }
        Returns: ElectionTally
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
