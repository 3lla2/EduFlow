export type UserRole = 'student' | 'teacher' | 'parent' | 'admin' | 'assistant';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  grade_level?: string;
  parent_id?: string;
  parent_name?: string;
  parent_email?: string;
  created_at?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  created_by?: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
}

export interface CourseGroup {
  id: string;
  course_id: string;
  teacher_id: string;
  name: string;
  start_date?: string;
  end_date?: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  course_title?: string;
  teacher_name?: string;
  active_students?: number;
}

export interface Enrollment {
  id: string;
  student_id: string;
  group_id: string;
  enrolled_at: string;
  status: 'active' | 'completed' | 'cancelled';
  student_name?: string;
  group_name?: string;
}

export interface Session {
  id: string;
  group_id: string;
  title: string;
  description?: string;
  session_number: number;
  video_url?: string;
  materials_url?: string;
  scheduled_at?: string;
  is_published: boolean;
  created_at: string;
}

export interface VideoPlay {
  id: string;
  session_id: string;
  student_id: string;
  started_at: string;
  ended_at?: string;
  play_number: number;
  created_at: string;
}

export interface Exam {
  id: string;
  session_id: string;
  title: string;
  passing_score: number;
  duration_minutes: number;
  is_published: boolean;
  created_at: string;
  subject?: string;
  grade_level?: string;
  deadline?: string;
  questions?: Question[];
  creator_role?: 'teacher' | 'assistant' | 'admin';
  creation_mode?: 'manual' | 'ai_generated' | 'material_upload';
  curriculum_type?: 'languages' | 'arabic';
  material_url?: string;
}

export interface StudentFollowUpRecord {
  student_id: string;
  student_name: string;
  student_code: string;
  phone?: string;
  parent_name?: string;
  parent_phone?: string;
  grade_level?: string;
  // Video status
  video_watched: boolean;
  video_play_count: number;
  max_plays: number;
  // Exam status
  exam_taken: boolean;
  exam_score?: number;
  exam_total?: number;
  exam_passed?: boolean;
  // Assignment status
  assignment_submitted: boolean;
  assignment_score?: number;
  // Attendance status
  attendance_status?: 'present' | 'absent' | 'late' | 'excused';
  // Financial status (per-student lookup view)
  amount_due: number;
  amount_paid: number;
  remaining_amount: number;
  payment_status: 'paid' | 'partially_paid' | 'unpaid' | 'waived' | 'overdue';
  payment_method?: string;
}

export interface Question {
  id: string;
  exam_id: string;
  question_text: string;
  question_type: 'mcq' | 'true_false';
  options: string[];
  correct_answer: string;
  points: number;
  explanation?: string;
}

export interface ExamAttempt {
  id: string;
  exam_id: string;
  student_id: string;
  score: number;
  total_score: number;
  passed: boolean;
  started_at: string;
  submitted_at?: string;
  exam_title?: string;
  subject?: string;
}

export interface ExamAttemptAnswer {
  attempt_id: string;
  question_id: string;
  answer_text: string;
  answered_at: string;
}

export interface Assignment {
  id: string;
  group_id: string;
  session_id?: string;
  title: string;
  description?: string;
  due_at?: string;
  max_score: number;
  is_published: boolean;
  created_by?: string;
  created_at: string;
  group_name?: string;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  submission_text?: string;
  file_url?: string;
  score?: number;
  teacher_feedback?: string;
  status: 'submitted' | 'graded' | 'returned';
  submitted_at: string;
  graded_at?: string;
  graded_by?: string;
  student_name?: string;
  assignment_title?: string;
  max_score?: number;
}

export interface Attendance {
  id: string;
  session_id: string;
  student_id: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  recorded_by?: string;
  recorded_at: string;
  session_title?: string;
  session_number?: number;
  student_name?: string;
  notes?: string;
}

export interface StudentPayment {
  id: string;
  student_id: string;
  group_id: string;
  session_id?: string;
  amount: number;
  currency: string;
  period_label?: string;
  due_date: string;
  status: 'unpaid' | 'partially_paid' | 'paid' | 'overdue' | 'waived';
  payment_method?: 'cash' | 'instapay' | 'vodafone_cash' | 'bank_transfer' | 'other';
  paid_at?: string;
  recorded_by?: string;
  notes?: string;
  created_at: string;
  waived_reason?: string;
  waived_at?: string;
  waived_by?: string;
  paid_amount?: number;
  remaining_amount?: number;
  student_name?: string;
  group_name?: string;
  // Aliases for convenience
  amount_due?: number;
  amount_paid?: number;
  cycle_month?: string;
}

export interface PaymentTransaction {
  id: string;
  student_payment_id: string;
  amount: number;
  payment_method: 'cash' | 'instapay' | 'vodafone_cash' | 'bank_transfer' | 'other';
  paid_at: string;
  recorded_by: string;
  notes?: string;
  created_at: string;
  reference_number?: string;
}

export interface GroupBillingSettings {
  id: string;
  group_id: string;
  payment_type: 'per_session' | 'monthly' | 'quarterly' | 'per_term' | 'per_course';
  amount: number;
  currency: string;
  created_at?: string;
}

export interface TeacherCompensation {
  id: string;
  group_id: string;
  teacher_id: string;
  compensation_type: 'per_session' | 'monthly' | 'quarterly' | 'per_term' | 'per_course' | 'percentage';
  amount: number;
  currency: string;
  created_at?: string;
}

export interface TeacherEarning {
  id: string;
  teacher_id: string;
  group_id: string;
  session_id?: string;
  amount: number;
  currency: string;
  description?: string;
  status: 'pending' | 'approved' | 'paid';
  calculated_at: string;
  paid_at?: string;
  notes?: string;
  teacher_name?: string;
  group_name?: string;
  session_title?: string;
}

export interface ParentStudentLink {
  id: string;
  parent_id: string;
  student_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at?: string;
}

export interface Complaint {
  id: string;
  submitted_by: string;
  subject: string;
  description: string;
  category?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assigned_to?: string;
  admin_response?: string;
  created_at: string;
  resolved_at?: string;
  submitter_name?: string;
  submitter_role?: string;
  assigned_name?: string;
  // Aliases for convenience
  title?: string;
  user_name?: string;
  user_role?: string;
  user_id?: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type?: 'session' | 'exam' | 'assignment' | 'payment' | 'complaint' | 'general' | 'info' | 'warning' | 'success';
  type?: 'session' | 'exam' | 'assignment' | 'payment' | 'complaint' | 'general' | 'info' | 'warning' | 'success';
  is_read: boolean;
  related_url?: string;
  created_at: string;
}

export interface CourseMaterial {
  id: string;
  course_id?: string;
  session_id?: string;
  title: string;
  description?: string;
  file_url: string;
  file_type?: string;
  uploaded_by?: string;
  created_at: string;
  group_id?: string;
  download_count?: number;
  rag_status?: 'pending' | 'processing' | 'completed' | 'failed';
  rag_error?: string;
  rag_processed_at?: string;
  rag_chunk_count?: number;
}

export interface StudentNote {
  id: string;
  student_id: string;
  teacher_id: string;
  group_id: string;
  note: string;
  created_at: string;
  teacher_name?: string;
  student_name?: string;
}

export interface AiConversation {
  id: string;
  user_id: string;
  group_id?: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface AiMessage {
  id: string;
  conversation_id: string;
  sender: 'user' | 'assistant';
  message: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface AutomationLog {
  id: string;
  trigger_name: string;
  source: 'n8n' | 'gemini' | 'webhook';
  payload_summary: string;
  status: 'success' | 'running' | 'failed';
  timestamp: string;
  target_email?: string;
}

export interface Flashcard {
  front: string;
  back: string;
  category?: string;
}

export interface GeneratedLessonData {
  title: string;
  grade: string;
  difficulty: string;
  summary: string;
  keyPoints: string[];
  flashcards: Flashcard[];
  questions: {
    question: string;
    choices: string[];
    correctIndex: number;
    explanation: string;
  }[];
}
