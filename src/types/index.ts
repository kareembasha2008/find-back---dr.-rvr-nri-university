export type Department =
  | 'CSE'
  | 'CSE-AI & ML'
  | 'ECE'
  | 'EEE'
  | 'ME'
  | 'CE'
  | 'Other';

export type Year = '1st Year' | '2nd Year' | '3rd Year' | '4th Year';

export type Section = 'A' | 'B' | 'C' | 'D' | 'Other';

export interface User {
  id: string;
  full_name: string;
  student_id: string;
  university_email: string;
  phone_number: string;
  department: Department;
  year: Year;
  section: Section;
  role: 'student' | 'admin';
  profile_photo_url?: string;
  onboarding_completed: boolean;
  profile_confirmed: boolean;
  created_at: string;
  updated_at: string;
}

export type ItemCategory =
  | 'ID Card'
  | 'Wallet'
  | 'Electronics'
  | 'Keys'
  | 'Books'
  | 'Bag'
  | 'Accessories'
  | 'Documents'
  | 'Other';

export type CampusLocation =
  | 'A Block'
  | 'B Block'
  | 'C Block'
  | 'Library'
  | 'Canteen'
  | 'Hostel'
  | 'Ground'
  | 'Parking'
  | 'Bus Area'
  | 'Other';

export type ItemStatus =
  | 'Searching'
  | 'Possible Match'
  | 'Verification Required'
  | 'Resolved'
  | 'Closed';

export type ReportType = 'lost' | 'found';

export interface Item {
  id: string;
  user_id: string;
  reporter_dept: string;
  reporter_year: string;
  type: ReportType;
  name: string;
  category: ItemCategory;
  location: CampusLocation;
  building_name?: string;
  latitude?: number | null;
  longitude?: number | null;
  date: string; // YYYY-MM-DD
  approx_time: string; // e.g. "11:30 AM"
  description: string;
  photo_url?: string;
  private_verification_question?: string;
  private_verification_answer?: string;
  status: ItemStatus;
  resolution_note?: string;
  created_at: string;
  updated_at: string;
}

export interface ContactRequest {
  id: string;
  item_id: string;
  claim_id?: string;
  requester_id: string;
  owner_id: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  message?: string;
  response_note?: string;
  created_at: string;
  updated_at: string;
}

export interface MatchBreakdown {
  category: number;
  name: number;
  location: number;
  time: number;
  description: number;
}

export interface Match {
  id: string;
  lost_item_id: string;
  found_item_id: string;
  score: number;
  breakdown: MatchBreakdown;
  status: 'suggested' | 'under_verification' | 'verified' | 'dismissed';
  created_at: string;
  updated_at: string;
}

export interface Claim {
  id: string;
  match_id?: string;
  lost_item_id: string;
  found_item_id: string;
  claimant_user_id: string;
  verification_answer: string;
  status: 'pending' | 'verified' | 'rejected';
  safe_exchange_location?: string;
  contact_requested: boolean;
  contact_granted: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'report_created' | 'possible_match' | 'verification_required' | 'item_resolved' | 'system';
  item_id?: string;
  match_id?: string;
  read: boolean;
  created_at: string;
  updated_at: string;
}

export interface SystemConfig {
  university_name: string;
  university_campus: string;
  allowed_email_domain: string;
  require_domain_match: boolean;
}
