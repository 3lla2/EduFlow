import {
  Profile,
  Course,
  CourseGroup,
  Enrollment,
  Session,
  VideoPlay,
  Exam,
  Question,
  ExamAttempt,
  Assignment,
  AssignmentSubmission,
  Attendance,
  StudentPayment,
  PaymentTransaction,
  GroupBillingSettings,
  TeacherCompensation,
  TeacherEarning,
  ParentStudentLink,
  Complaint,
  AppNotification,
  CourseMaterial,
  StudentNote,
  AiConversation,
  AiMessage,
  AutomationLog,
  StudentFollowUpRecord,
} from '../types/database';

const STORAGE_KEY = 'eduflow_db_v1';

// Seed Initial Database State
function getInitialData() {
  const profiles: Profile[] = [
    {
      id: 'stu-1',
      full_name: 'عمر حازم السيد',
      email: 'omar.hazem@eduflow.edu',
      phone: '01012345678',
      role: 'student',
      avatar: '👨‍🎓',
      grade_level: 'الصف الثاني الإعدادي',
      parent_id: 'par-1',
      parent_name: 'أ. وليد حازم',
      parent_email: 'walid.hazem@gmail.com',
      created_at: '2026-09-01T10:00:00Z',
    },
    {
      id: 'stu-2',
      full_name: 'سلمى الشريف',
      email: 'salma.elsharif@eduflow.edu',
      phone: '01198765432',
      role: 'student',
      avatar: '👩‍🎓',
      grade_level: 'الصف الثاني الإعدادي',
      parent_id: 'par-1',
      parent_name: 'أ. وليد حازم',
      parent_email: 'walid.hazem@gmail.com',
      created_at: '2026-09-01T10:00:00Z',
    },
    {
      id: 'stu-3',
      full_name: 'زياد طارق المنياوي',
      email: 'ziad.tarek@eduflow.edu',
      phone: '01234567890',
      role: 'student',
      avatar: '👨‍🎓',
      grade_level: 'الصف الثالث الإعدادي',
      parent_id: 'par-2',
      parent_name: 'م. طارق المنياوي',
      parent_email: 'tarek.elminyawi@gmail.com',
      created_at: '2026-09-02T10:00:00Z',
    },
    {
      id: 'stu-4',
      full_name: 'جودي كريم الشناوي (Judy Karim)',
      email: 'judy.karim@eduflow.edu',
      phone: '01066778899',
      role: 'student',
      avatar: '👩‍🔬',
      grade_level: 'Sec 1 - STEM & Languages (أولى ثانوي لغات)',
      parent_id: 'par-1',
      parent_name: 'د. كريم الشناوي',
      parent_email: 'dr.karim.shennawy@gmail.com',
      created_at: '2026-09-03T10:00:00Z',
    },
    {
      id: 'tea-1',
      full_name: 'أ. أحمد رضوان',
      email: 'ahmed.radwan@eduflow.edu',
      phone: '01099887766',
      role: 'teacher',
      avatar: '👨‍🏫',
      created_at: '2026-08-15T09:00:00Z',
    },
    {
      id: 'tea-2',
      full_name: 'د. مروة محمود',
      email: 'marwa.mahmoud@eduflow.edu',
      phone: '01122334455',
      role: 'teacher',
      avatar: '👩‍🏫',
      created_at: '2026-08-20T09:00:00Z',
    },
    {
      id: 'par-1',
      full_name: 'أ. وليد حازم',
      email: 'walid.hazem@gmail.com',
      phone: '01055566677',
      role: 'parent',
      avatar: '👨‍💼',
      created_at: '2026-09-01T11:00:00Z',
    },
    {
      id: 'par-2',
      full_name: 'م. طارق المنياوي',
      email: 'tarek.elminyawi@gmail.com',
      phone: '01077788899',
      role: 'parent',
      avatar: '👨‍💼',
      created_at: '2026-09-02T11:00:00Z',
    },
    {
      id: 'ast-1',
      full_name: 'أ. كريم نبيل (المساعد التعليمي والمنسق)',
      email: 'karim.nabil@eduflow.edu',
      phone: '01044332211',
      role: 'assistant',
      avatar: '🧑‍💻',
      created_at: '2026-08-10T08:30:00Z',
    },
    {
      id: 'adm-1',
      full_name: 'م. سيف عمرو (مدير المنظومة)',
      email: 'seifamrmohsen2005@gmail.com',
      phone: '01011122233',
      role: 'admin',
      avatar: '⚡',
      created_at: '2026-08-01T08:00:00Z',
    },
  ];

  const courses: Course[] = [
    {
      id: 'c-1',
      title: 'العلوم العامة والأحياء - الصف الثاني الإعدادي',
      description: 'المنهج المتكامل لتدريس الجهاز الدوري، التركيب الذري، والحركة والضغط الجوي.',
      status: 'published',
      created_by: 'tea-1',
      created_at: '2026-08-25T10:00:00Z',
    },
    {
      id: 'c-2',
      title: 'الرياضيات والجبر - الصف الثاني الإعدادي',
      description: 'التحليل الرياضي، حل المعادلات، والهندسة التحليلية مع تطبيقات عملية.',
      status: 'published',
      created_by: 'tea-2',
      created_at: '2026-08-28T10:00:00Z',
    },
    {
      id: 'c-3',
      title: 'الفيزياء الأساسية - المرحلة الثانوية',
      description: 'الميكانيكا وقوانين الحركة وقوانين نيوتن والطاقة.',
      status: 'published',
      created_by: 'tea-1',
      created_at: '2026-09-01T10:00:00Z',
    },
  ];

  const groups: CourseGroup[] = [
    {
      id: 'g-1',
      course_id: 'c-1',
      teacher_id: 'tea-1',
      name: 'مجموعة الأوائل - علوم 2 إعدادي (السبت والثلاثاء)',
      start_date: '2026-09-15',
      end_date: '2027-01-30',
      status: 'active',
      created_at: '2026-09-01T12:00:00Z',
      course_title: 'العلوم العامة والأحياء - الصف الثاني الإعدادي',
      teacher_name: 'أ. أحمد رضوان',
      active_students: 2,
    },
    {
      id: 'g-2',
      course_id: 'c-2',
      teacher_id: 'tea-2',
      name: 'مجموعة العباقرة - رياضيات 2 إعدادي',
      start_date: '2026-09-16',
      end_date: '2027-01-30',
      status: 'active',
      created_at: '2026-09-02T12:00:00Z',
      course_title: 'الرياضيات والجبر - الصف الثاني الإعدادي',
      teacher_name: 'د. مروة محمود',
      active_students: 2,
    },
  ];

  const enrollments: Enrollment[] = [
    {
      id: 'enr-1',
      student_id: 'stu-1',
      group_id: 'g-1',
      enrolled_at: '2026-09-10T10:00:00Z',
      status: 'active',
      student_name: 'عمر حازم السيد',
      group_name: 'مجموعة الأوائل - علوم 2 إعدادي',
    },
    {
      id: 'enr-2',
      student_id: 'stu-2',
      group_id: 'g-1',
      enrolled_at: '2026-09-11T10:00:00Z',
      status: 'active',
      student_name: 'سلمى الشريف',
      group_name: 'مجموعة الأوائل - علوم 2 إعدادي',
    },
    {
      id: 'enr-3',
      student_id: 'stu-1',
      group_id: 'g-2',
      enrolled_at: '2026-09-10T10:00:00Z',
      status: 'active',
      student_name: 'عمر حازم السيد',
      group_name: 'مجموعة العباقرة - رياضيات 2 إعدادي',
    },
    {
      id: 'enr-4',
      student_id: 'stu-4',
      group_id: 'g-1',
      enrolled_at: '2026-09-12T10:00:00Z',
      status: 'active',
      student_name: 'جودي كريم الشناوي (Judy Karim)',
      group_name: 'مجموعة الأوائل - علوم 2 إعدادي',
    },
  ];

  const sessions: Session[] = [
    {
      id: 'sess-1',
      group_id: 'g-1',
      title: 'الحصة 1: مدخل إلى التركيب الذري والجدول الدوري',
      description: 'دراسة النواة، الإلكترونات، والروابط الكيميائية مع أمثلة تفاعلية.',
      session_number: 1,
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      materials_url: 'https://example.com/materials/session-1.pdf',
      scheduled_at: '2026-09-20T17:00:00Z',
      is_published: true,
      created_at: '2026-09-15T10:00:00Z',
    },
    {
      id: 'sess-2',
      group_id: 'g-1',
      title: 'الحصة 2: الجهاز الدوري ووظائف القلب والدم',
      description: 'شرح الدورة الدموية الكبرى والصغرى وتركيب الدم ومكونات البلازما.',
      session_number: 2,
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      materials_url: 'https://example.com/materials/session-2.pdf',
      scheduled_at: '2026-09-27T17:00:00Z',
      is_published: true,
      created_at: '2026-09-22T10:00:00Z',
    },
    {
      id: 'sess-3',
      group_id: 'g-1',
      title: 'الحصة 3: الجهاز التنفسي والتبادل الغازي',
      description: 'تركيب الرئتين والحويصلات الهوائية وميكانيكية التنفس.',
      session_number: 3,
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      materials_url: 'https://example.com/materials/session-3.pdf',
      scheduled_at: '2026-10-04T17:00:00Z',
      is_published: true,
      created_at: '2026-09-30T10:00:00Z',
    },
  ];

  const videoPlays: VideoPlay[] = [
    {
      id: 'vp-1',
      session_id: 'sess-1',
      student_id: 'stu-1',
      started_at: '2026-09-21T18:00:00Z',
      ended_at: '2026-09-21T18:45:00Z',
      play_number: 1,
      created_at: '2026-09-21T18:00:00Z',
    },
  ];

  const exams: Exam[] = [
    {
      id: 'ex-1',
      session_id: 'sess-1',
      title: 'اختبار الحصة 1: التركيب الذري والمفاهيم الكيميائية',
      passing_score: 70,
      duration_minutes: 15,
      is_published: true,
      created_at: '2026-09-18T10:00:00Z',
      subject: 'علوم',
      grade_level: 'الصف الثاني الإعدادي',
      deadline: 'متاح للحل الآن',
      questions: [
        {
          id: 'q-101',
          exam_id: 'ex-1',
          question_text: 'أي من الجسيمات التالية يحمل شحنة موجبة داخل نواة الذرة؟',
          question_type: 'mcq',
          options: ['الإلكترونات', 'البروتونات', 'النيوترونات', 'الفوتونات'],
          correct_answer: 'البروتونات',
          points: 1,
          explanation: 'البروتونات جسيمات موجبة الشحنة وتوجد داخل نواة الذرة مع النيوترونات المتعادلة.',
        },
        {
          id: 'q-102',
          exam_id: 'ex-1',
          question_text: 'الذرة متعادلة كهربياً في حالتها العادية لأن عدد البروتونات يساوي عدد الإلكترونات.',
          question_type: 'true_false',
          options: ['صواب', 'خطأ'],
          correct_answer: 'صواب',
          points: 1,
          explanation: 'تتعادل الشحنات الموجبة للبروتونات مع الشحنات السالبة للإلكترونات الخارجية.',
        },
        {
          id: 'q-103',
          exam_id: 'ex-1',
          question_text: 'أقصى عدد من الإلكترونات يستوعبه مستوى الطاقة الأول (K) هو:',
          question_type: 'mcq',
          options: ['2 إلكترون', '8 إلكترونات', '18 إلكترون', '32 إلكترون'],
          correct_answer: '2 إلكترون',
          points: 1,
          explanation: 'طبقاً للقاعدة 2n²، فإن المستوى الأول n=1 يستوعب 2*(1)² = 2 إلكترون.',
        },
      ],
    },
    {
      id: 'ex-2',
      session_id: 'sess-2',
      title: 'اختبار الحصة 2: الجهاز الدوري ووظائف القلب والدم',
      passing_score: 70,
      duration_minutes: 20,
      is_published: true,
      created_at: '2026-09-25T10:00:00Z',
      subject: 'أحياء وعلوم',
      grade_level: 'الصف الثاني الإعدادي',
      deadline: 'قبل موعد الحصة القادمة',
      questions: [
        {
          id: 'q-201',
          exam_id: 'ex-2',
          question_text: 'ما هو العضو العضلي الذي يضخ الدم المحمل بالأكسجين إلى جميع أجزاء الجسم؟',
          question_type: 'mcq',
          options: ['الرئتان', 'القلب', 'الكبد', 'الكليتان'],
          correct_answer: 'القلب',
          points: 1,
          explanation: 'القلب هو المضخة المركزية للدورة الدموية وينبض لدفع الدم لكافة خلايا الجسم.',
        },
        {
          id: 'q-202',
          exam_id: 'ex-2',
          question_text: 'المسؤول عن تخثر الدم وتكوين الجلطة الواقية عند حدوث جرح هو:',
          question_type: 'mcq',
          options: ['خلايا الدم الحمراء', 'خلايا الدم البيضاء', 'الصفائح الدموية', 'الهيموجلوبين'],
          correct_answer: 'الصفائح الدموية',
          points: 1,
          explanation: 'الصفائح الدموية أجزاء خلوية تلعب الدور الأساسي في إيقاف النزيف وتجلط الدم.',
        },
        {
          id: 'q-203',
          exam_id: 'ex-2',
          question_text: 'الشرايين تحمل الدم دائماً من القلب إلى أعضاء الجسم المختلفة.',
          question_type: 'true_false',
          options: ['صواب', 'خطأ'],
          correct_answer: 'صواب',
          points: 1,
          explanation: 'الشريان ينقل الدم الصادر من القلب، بينما الوريد يعيد الدم إلى القلب.',
        },
        {
          id: 'q-204',
          exam_id: 'ex-2',
          question_text: 'تتكون بلازما الدم في معظمها (حوالي 90%) من:',
          question_type: 'mcq',
          options: ['الماء', 'البروتينات', 'الأملاح', 'الدهون'],
          correct_answer: 'الماء',
          points: 1,
          explanation: 'الماء يشكل حوالي 90-92% من حجم بلازما الدم لنقل المواد الغذائية والهرمونات.',
        },
      ],
    },
  ];

  const examAttempts: ExamAttempt[] = [
    {
      id: 'att-1',
      exam_id: 'ex-1',
      student_id: 'stu-1',
      score: 3,
      total_score: 3,
      passed: true,
      started_at: '2026-09-22T14:00:00Z',
      submitted_at: '2026-09-22T14:08:00Z',
      exam_title: 'اختبار الحصة 1: التركيب الذري',
      subject: 'علوم',
    },
  ];

  const assignments: Assignment[] = [
    {
      id: 'asg-1',
      group_id: 'g-1',
      session_id: 'sess-2',
      title: 'واجب منزلي: مقارنة بين خلايا الدم الحمراء والبيضاء',
      description: 'قم بكتابة ملخص في 5 أسطر أو ارفع ملف يوضح الفرق الوظيفي والشكل بين كريات الدم الحمراء والبيضاء.',
      due_at: '2026-11-20T23:59:00Z',
      max_score: 20,
      is_published: true,
      created_by: 'tea-1',
      created_at: '2026-09-28T10:00:00Z',
      group_name: 'مجموعة الأوائل - علوم 2 إعدادي',
    },
    {
      id: 'asg-2',
      group_id: 'g-1',
      session_id: 'sess-1',
      title: 'واجب التركيب الذري: التوزيع الإلكتروني لـ 5 عناصر',
      description: 'اكتب التوزيع الإلكتروني لكل من (الصوديوم Na، الأكسجين O، الكلور Cl، المغنيسيوم Mg، النيون Ne).',
      due_at: '2026-11-15T23:59:00Z',
      max_score: 15,
      is_published: true,
      created_by: 'tea-1',
      created_at: '2026-09-20T10:00:00Z',
      group_name: 'مجموعة الأوائل - علوم 2 إعدادي',
    },
  ];

  const submissions: AssignmentSubmission[] = [
    {
      id: 'sub-1',
      assignment_id: 'asg-2',
      student_id: 'stu-1',
      submission_text: 'التوزيع الإلكتروني: Na (2,8,1) - O (2,6) - Cl (2,8,7) - Mg (2,8,2) - Ne (2,8). جميع المستويات موزعة حسب قواعد الطاقة.',
      file_url: 'https://example.com/homework-omar.pdf',
      score: 15,
      teacher_feedback: 'إجابة نموذجية ومنظمة جداً يا عمر، أحسنت وبارك الله فيك!',
      status: 'graded',
      submitted_at: '2026-09-21T16:00:00Z',
      graded_at: '2026-09-22T09:30:00Z',
      graded_by: 'tea-1',
      student_name: 'عمر حازم السيد',
      assignment_title: 'واجب التركيب الذري: التوزيع الإلكتروني',
      max_score: 15,
    },
  ];

  const attendance: Attendance[] = [
    {
      id: 'att-101',
      session_id: 'sess-1',
      student_id: 'stu-1',
      status: 'present',
      recorded_by: 'tea-1',
      recorded_at: '2026-09-20T17:15:00Z',
      session_title: 'الحصة 1: مدخل إلى التركيب الذري',
      session_number: 1,
      student_name: 'عمر حازم السيد',
    },
    {
      id: 'att-102',
      session_id: 'sess-1',
      student_id: 'stu-2',
      status: 'present',
      recorded_by: 'tea-1',
      recorded_at: '2026-09-20T17:15:00Z',
      session_title: 'الحصة 1: مدخل إلى التركيب الذري',
      session_number: 1,
      student_name: 'سلمى الشريف',
    },
    {
      id: 'att-103',
      session_id: 'sess-2',
      student_id: 'stu-1',
      status: 'present',
      recorded_by: 'tea-1',
      recorded_at: '2026-09-27T17:10:00Z',
      session_title: 'الحصة 2: الجهاز الدوري ووظائف القلب',
      session_number: 2,
      student_name: 'عمر حازم السيد',
    },
    {
      id: 'att-104',
      session_id: 'sess-2',
      student_id: 'stu-2',
      status: 'late',
      recorded_by: 'tea-1',
      recorded_at: '2026-09-27T17:25:00Z',
      session_title: 'الحصة 2: الجهاز الدوري ووظائف القلب',
      session_number: 2,
      student_name: 'سلمى الشريف',
    },
  ];

  const billingSettings: GroupBillingSettings[] = [
    {
      id: 'gbs-1',
      group_id: 'g-1',
      payment_type: 'monthly',
      amount: 450,
      currency: 'EGP',
      created_at: '2026-09-01T10:00:00Z',
    },
    {
      id: 'gbs-2',
      group_id: 'g-2',
      payment_type: 'monthly',
      amount: 450,
      currency: 'EGP',
      created_at: '2026-09-02T10:00:00Z',
    },
  ];

  const studentPayments: StudentPayment[] = [
    {
      id: 'inv-1',
      student_id: 'stu-1',
      group_id: 'g-1',
      amount: 450,
      currency: 'EGP',
      period_label: 'اشتراك شهر سبتمبر 2026',
      due_date: '2026-09-10',
      status: 'paid',
      payment_method: 'instapay',
      paid_at: '2026-09-08T14:20:00Z',
      recorded_by: 'adm-1',
      notes: 'تم التحويل عبر تطبيق إنستاباي واستلام إشعار البنك',
      created_at: '2026-09-01T10:00:00Z',
      paid_amount: 450,
      remaining_amount: 0,
      student_name: 'عمر حازم السيد',
      group_name: 'مجموعة الأوائل - علوم 2 إعدادي',
    },
    {
      id: 'inv-2',
      student_id: 'stu-1',
      group_id: 'g-1',
      amount: 450,
      currency: 'EGP',
      period_label: 'اشتراك شهر أكتوبر 2026',
      due_date: '2026-10-10',
      status: 'paid',
      payment_method: 'vodafone_cash',
      paid_at: '2026-10-09T18:15:00Z',
      recorded_by: 'adm-1',
      notes: 'فودافون كاش - كود الإيصال #99824',
      created_at: '2026-10-01T10:00:00Z',
      paid_amount: 450,
      remaining_amount: 0,
      student_name: 'عمر حازم السيد',
      group_name: 'مجموعة الأوائل - علوم 2 إعدادي',
    },
    {
      id: 'inv-3',
      student_id: 'stu-1',
      group_id: 'g-1',
      amount: 450,
      currency: 'EGP',
      period_label: 'اشتراك شهر نوفمبر 2026',
      due_date: '2026-11-10',
      status: 'partially_paid',
      payment_method: 'instapay',
      created_at: '2026-11-01T10:00:00Z',
      paid_amount: 250,
      remaining_amount: 200,
      student_name: 'عمر حازم السيد',
      group_name: 'مجموعة الأوائل - علوم 2 إعدادي',
    },
    {
      id: 'inv-4',
      student_id: 'stu-2',
      group_id: 'g-1',
      amount: 450,
      currency: 'EGP',
      period_label: 'اشتراك شهر أكتوبر 2026',
      due_date: '2026-10-05',
      status: 'overdue',
      created_at: '2026-10-01T10:00:00Z',
      paid_amount: 0,
      remaining_amount: 450,
      student_name: 'سلمى الشريف',
      group_name: 'مجموعة الأوائل - علوم 2 إعدادي',
    },
  ];

  const paymentTransactions: PaymentTransaction[] = [
    {
      id: 'pt-1',
      student_payment_id: 'inv-1',
      amount: 450,
      payment_method: 'instapay',
      paid_at: '2026-09-08T14:20:00Z',
      recorded_by: 'adm-1',
      notes: 'سداد كامل',
      created_at: '2026-09-08T14:20:00Z',
    },
    {
      id: 'pt-2',
      student_payment_id: 'inv-2',
      amount: 450,
      payment_method: 'vodafone_cash',
      paid_at: '2026-10-09T18:15:00Z',
      recorded_by: 'adm-1',
      notes: 'سداد كامل',
      created_at: '2026-10-09T18:15:00Z',
    },
    {
      id: 'pt-3',
      student_payment_id: 'inv-3',
      amount: 250,
      payment_method: 'instapay',
      paid_at: '2026-11-05T12:00:00Z',
      recorded_by: 'adm-1',
      notes: 'دفعة أولى 250 جنيه والمتبقي 200 جنيه',
      created_at: '2026-11-05T12:00:00Z',
    },
  ];

  const teacherComp: TeacherCompensation[] = [
    {
      id: 'tc-1',
      group_id: 'g-1',
      teacher_id: 'tea-1',
      compensation_type: 'per_session',
      amount: 200,
      currency: 'EGP',
      created_at: '2026-09-01T10:00:00Z',
    },
    {
      id: 'tc-2',
      group_id: 'g-2',
      teacher_id: 'tea-2',
      compensation_type: 'per_session',
      amount: 200,
      currency: 'EGP',
      created_at: '2026-09-02T10:00:00Z',
    },
  ];

  const teacherEarnings: TeacherEarning[] = [
    {
      id: 'te-1',
      teacher_id: 'tea-1',
      group_id: 'g-1',
      session_id: 'sess-1',
      amount: 200,
      currency: 'EGP',
      description: 'مستحقات تدريس الحصة 1 (التركيب الذري)',
      status: 'paid',
      calculated_at: '2026-09-20T19:00:00Z',
      paid_at: '2026-09-30T12:00:00Z',
      teacher_name: 'أ. أحمد رضوان',
      group_name: 'مجموعة الأوائل - علوم 2 إعدادي',
      session_title: 'الحصة 1',
    },
    {
      id: 'te-2',
      teacher_id: 'tea-1',
      group_id: 'g-1',
      session_id: 'sess-2',
      amount: 200,
      currency: 'EGP',
      description: 'مستحقات تدريس الحصة 2 (الجهاز الدوري)',
      status: 'approved',
      calculated_at: '2026-09-27T19:00:00Z',
      teacher_name: 'أ. أحمد رضوان',
      group_name: 'مجموعة الأوائل - علوم 2 إعدادي',
      session_title: 'الحصة 2',
    },
    {
      id: 'te-3',
      teacher_id: 'tea-1',
      group_id: 'g-1',
      session_id: 'sess-3',
      amount: 200,
      currency: 'EGP',
      description: 'مستحقات تدريس الحصة 3 (الجهاز التنفسي)',
      status: 'pending',
      calculated_at: '2026-10-04T19:00:00Z',
      teacher_name: 'أ. أحمد رضوان',
      group_name: 'مجموعة الأوائل - علوم 2 إعدادي',
      session_title: 'الحصة 3',
    },
  ];

  const parentLinks: ParentStudentLink[] = [
    {
      id: 'psl-1',
      parent_id: 'par-1',
      student_id: 'stu-1',
      status: 'approved',
      created_at: '2026-09-01T10:00:00Z',
    },
    {
      id: 'psl-2',
      parent_id: 'par-1',
      student_id: 'stu-2',
      status: 'approved',
      created_at: '2026-09-01T10:00:00Z',
    },
    {
      id: 'psl-3',
      parent_id: 'par-2',
      student_id: 'stu-3',
      status: 'approved',
      created_at: '2026-09-02T10:00:00Z',
    },
  ];

  const complaints: Complaint[] = [
    {
      id: 'comp-1',
      submitted_by: 'par-1',
      subject: 'طلب توفير تسجيل مراجعة الجهاز الدوري بصيغة خفيفة',
      description: 'نرجو من الإدارة توفير نسخة خفيفة التحميل من فيديو الحصة لضعف الإنترنت المنزلي أحياناً.',
      category: 'تقنية وفيديو',
      priority: 'normal',
      status: 'resolved',
      assigned_to: 'adm-1',
      admin_response: 'تم بحمد الله رفع جودة متعددة (360p و 720p) عبر مشغل الفيديو السحابي لتيسير المذاكرة.',
      created_at: '2026-09-28T11:00:00Z',
      resolved_at: '2026-09-29T15:00:00Z',
      submitter_name: 'أ. وليد حازم (ولي أمر)',
      submitter_role: 'parent',
      assigned_name: 'م. سيف عمرو',
    },
    {
      id: 'comp-2',
      submitted_by: 'stu-1',
      subject: 'استفسار عن موعد الاختبار التجريبي الشهري',
      description: 'هل اختبار نهاية الوحدة الأولى سيشمل الحصة الثالثة الخاصة بالجهاز التنفسي؟',
      category: 'أكاديمي وامتحانات',
      priority: 'low',
      status: 'open',
      created_at: '2026-10-05T14:30:00Z',
      submitter_name: 'عمر حازم السيد (طالب)',
      submitter_role: 'student',
    },
  ];

  const notifications: AppNotification[] = [
    {
      id: 'notif-1',
      user_id: 'stu-1',
      title: '🎉 تهانينا! تفوق في الاختبار',
      message: 'لقد حصلت على الدرجة النهائية (3/3) في اختبار التركيب الذري.',
      notification_type: 'exam',
      is_read: false,
      related_url: '/exams/ex-1',
      created_at: '2026-09-22T14:09:00Z',
    },
    {
      id: 'notif-2',
      user_id: 'stu-1',
      title: '📋 تم نشر الحصة الثانية',
      message: 'قام أ. أحمد رضوان بنشر حصة الجهاز الدوري ومرفقات الشرح.',
      notification_type: 'session',
      is_read: true,
      related_url: '/sessions/sess-2',
      created_at: '2026-09-25T11:00:00Z',
    },
    {
      id: 'notif-3',
      user_id: 'par-1',
      title: '✉️ تقرير تفوق ابنكم عمر حازم',
      message: 'أتم عمر الحصة واختبار العلوم بنسبة 100% وحضوره منتظم بنسبة 100%.',
      notification_type: 'exam',
      is_read: false,
      created_at: '2026-09-22T14:10:00Z',
    },
  ];

  const courseMaterials: CourseMaterial[] = [
    {
      id: 'mat-1',
      course_id: 'c-1',
      session_id: 'sess-1',
      title: 'مذكرة التركيب الذري وقوانين بور للمستويات',
      description: 'ملف PDF يحتوي على الجداول والرسومات التوضيحية لمدارات الطاقة.',
      file_url: 'https://storage.eduflow.edu/materials/atomic-structure.pdf',
      file_type: 'pdf',
      uploaded_by: 'tea-1',
      created_at: '2026-09-16T10:00:00Z',
      rag_status: 'completed',
      rag_chunk_count: 14,
      rag_processed_at: '2026-09-16T10:02:00Z',
    },
    {
      id: 'mat-2',
      course_id: 'c-1',
      session_id: 'sess-2',
      title: 'أطلس الجهاز الدوري وصمامات القلب بالصور الملونة',
      description: 'دليل مرئي توضيحي لضغط الدم ومسار الدورة الدموية الكبرى والصغرى.',
      file_url: 'https://storage.eduflow.edu/materials/circulatory-atlas.pdf',
      file_type: 'pdf',
      uploaded_by: 'tea-1',
      created_at: '2026-09-23T10:00:00Z',
      rag_status: 'completed',
      rag_chunk_count: 22,
      rag_processed_at: '2026-09-23T10:03:00Z',
    },
  ];

  const studentNotes: StudentNote[] = [
    {
      id: 'sn-1',
      student_id: 'stu-1',
      teacher_id: 'tea-1',
      group_id: 'g-1',
      note: 'عمر طالب ذكي ومتفاعل ومستواه متميز في استيعاب المفاهيم المجردة والتوزيع الإلكتروني.',
      created_at: '2026-09-23T12:00:00Z',
      teacher_name: 'أ. أحمد رضوان',
      student_name: 'عمر حازم السيد',
    },
  ];

  const aiConversations: AiConversation[] = [
    {
      id: 'conv-1',
      user_id: 'stu-1',
      group_id: 'g-1',
      title: 'استفسار عن الشرايين والأوردة',
      created_at: '2026-09-27T18:00:00Z',
      updated_at: '2026-09-27T18:05:00Z',
    },
  ];

  const aiMessages: AiMessage[] = [
    {
      id: 'msg-1',
      conversation_id: 'conv-1',
      sender: 'user',
      message: 'ما هو الشريان الوحيد في جسم الإنسان الذي يحمل دماً غير مؤكسج؟',
      created_at: '2026-09-27T18:01:00Z',
    },
    {
      id: 'msg-2',
      conversation_id: 'conv-1',
      sender: 'assistant',
      message: 'سؤال ممتاز يا عمر! الشريان الوحيد الذي يحمل دماً غير مؤكسج (محمل بثاني أكسيد الكربون) هو الشريان الرئوي (Pulmonary Artery)، حيث ينقل الدم من البطين الأيمن للقلب إلى الرئتين ليتزود بالأكسجين.',
      created_at: '2026-09-27T18:01:30Z',
    },
  ];

  const automationLogs: AutomationLog[] = [
    {
      id: 'aut-1',
      trigger_name: 'WebHook: Quiz Passed -> Gmail Parent Alert',
      source: 'n8n',
      payload_summary: 'إرسال شهادة وتقرير الطالب عمر حازم لبريد ولي الأمر walid.hazem@gmail.com',
      status: 'success',
      timestamp: '2026-09-22T14:09:15Z',
      target_email: 'walid.hazem@gmail.com',
    },
    {
      id: 'aut-2',
      trigger_name: 'Sync: Student Exam Score -> Google Sheets',
      source: 'n8n',
      payload_summary: 'إضافة صف الدرجات في شيت الكنترول المركزي للمرحلة الإعدادية',
      status: 'success',
      timestamp: '2026-09-22T14:09:20Z',
    },
    {
      id: 'aut-3',
      trigger_name: 'RAG Pipeline: Ingest Course Materials',
      source: 'gemini',
      payload_summary: 'تحليل ملف atomic-structure.pdf وتوليد 14 متجه RAG للذكاء الاصطناعي',
      status: 'success',
      timestamp: '2026-09-16T10:02:15Z',
    },
    {
      id: 'aut-4',
      trigger_name: 'Financial: Overdue Invoice Reminder',
      source: 'n8n',
      payload_summary: 'إرسال إشعار استحقاق اشتراك شهر أكتوبر للمتأخرات',
      status: 'success',
      timestamp: '2026-10-11T09:00:00Z',
    },
  ];

  return {
    profiles,
    courses,
    groups,
    enrollments,
    sessions,
    videoPlays,
    exams,
    examAttempts,
    assignments,
    submissions,
    attendance,
    billingSettings,
    studentPayments,
    paymentTransactions,
    teacherComp,
    teacherEarnings,
    parentLinks,
    complaints,
    notifications,
    courseMaterials,
    studentNotes,
    aiConversations,
    aiMessages,
    automationLogs,
    currentUserId: 'stu-1', // Default viewing persona: Student
  };
}

export type DatabaseState = ReturnType<typeof getInitialData>;

class MockDatabaseService {
  public state: DatabaseState;
  private listeners: Array<() => void> = [];

  constructor() {
    this.state = this.loadState();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch (err) {
        console.error('Listener notification error:', err);
      }
    });
  }

  private loadState(): DatabaseState {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          return parsed;
        }
      } catch (e) {
        console.warn('Failed to load DB from localStorage:', e);
      }
    }
    return getInitialData();
  }

  public persist() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch (e) {
        console.warn('Failed to persist DB to localStorage:', e);
      }
    }
    this.notify();
  }

  resetToDefault() {
    this.state = getInitialData();
    this.persist();
  }

  reset() {
    this.resetToDefault();
  }

  // Current Auth User
  getCurrentUser(): Profile | null {
    if (!this.state.currentUserId) return null;
    const user = this.state.profiles.find((p) => p.id === this.state.currentUserId);
    return user || null;
  }

  getCurrentProfile(): Profile | null {
    return this.getCurrentUser();
  }

  getProfileById(userId: string): Profile | undefined {
    return this.state.profiles.find((p) => p.id === userId);
  }

  setCurrentUser(userId: string) {
    const exists = this.state.profiles.some((p) => p.id === userId);
    if (exists) {
      this.state.currentUserId = userId;
      this.persist();
    }
  }

  setCurrentProfile(userId: string) {
    this.setCurrentUser(userId);
  }

  logout() {
    this.state.currentUserId = '';
    this.persist();
  }

  login(identifier: string, _password?: string): { success: boolean; profile?: Profile; error?: string } {
    const cleanId = identifier.trim().toLowerCase();
    const profile = this.state.profiles.find(
      (p) =>
        p.email.toLowerCase() === cleanId ||
        p.id.toLowerCase() === cleanId ||
        (p.phone && p.phone === cleanId) ||
        p.full_name.toLowerCase().includes(cleanId)
    );
    if (!profile) {
      return { success: false, error: 'لم يتم العثور على حساب مطابق للبيانات المدخلة. يرجى التأكد من البريد أو رقم الهاتف.' };
    }
    this.state.currentUserId = profile.id;
    this.persist();
    return { success: true, profile };
  }

  getProfiles(): Profile[] {
    return [...this.state.profiles];
  }

  getStudents(): Profile[] {
    return this.state.profiles.filter((p) => p.role === 'student');
  }

  getTeachers(): Profile[] {
    return this.state.profiles.filter((p) => p.role === 'teacher');
  }

  getParents(): Profile[] {
    return this.state.profiles.filter((p) => p.role === 'parent');
  }

  getAssistants(): Profile[] {
    return this.state.profiles.filter((p) => p.role === 'assistant');
  }

  getCourses(): Course[] {
    return [...this.state.courses];
  }

  addCourse(course: Omit<Course, 'id' | 'created_at'>): Course {
    const newCourse: Course = {
      ...course,
      id: 'c-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    this.state.courses.push(newCourse);
    this.persist();
    return newCourse;
  }

  getGroups(): CourseGroup[] {
    return [...this.state.groups];
  }

  getGroupsForTeacher(teacherId: string): CourseGroup[] {
    return this.state.groups.filter((g) => g.teacher_id === teacherId);
  }

  getGroupsForStudent(studentId: string): CourseGroup[] {
    const enrGroupIds = this.state.enrollments
      .filter((e) => e.student_id === studentId && e.status === 'active')
      .map((e) => e.group_id);
    return this.state.groups.filter((g) => enrGroupIds.includes(g.id));
  }

  getSessions(groupId?: string): Session[] {
    if (groupId) {
      return this.state.sessions.filter((s) => s.group_id === groupId);
    }
    return [...this.state.sessions];
  }

  addSession(session: Omit<Session, 'id' | 'created_at'>): Session {
    const newSession: Session = {
      ...session,
      id: 'sess-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    this.state.sessions.push(newSession);

    // Auto notify enrolled students
    const enrolled = this.state.enrollments.filter((e) => e.group_id === session.group_id);
    enrolled.forEach((e) => {
      this.addNotification({
        user_id: e.student_id,
        title: `📚 حصة جديدة: ${session.title}`,
        message: `تم نشر الحصة رقم ${session.session_number} من قِبل المعلم.`,
        notification_type: 'session',
        related_url: `/sessions/${newSession.id}`,
      });
    });

    this.persist();
    return newSession;
  }

  // Video Plays Enforcement (Max 3 plays allowed rule)
  startSessionVideo(sessionId: string, studentId: string): {
    allowed: boolean;
    play_id?: string;
    play_number: number;
    remaining_plays: number;
    reason?: string;
  } {
    // Check previous session exam passed rule
    const currentSession = this.state.sessions.find((s) => s.id === sessionId);
    if (currentSession && currentSession.session_number > 1) {
      const prevSession = this.state.sessions.find(
        (s) => s.group_id === currentSession.group_id && s.session_number === currentSession.session_number - 1
      );
      if (prevSession) {
        const prevExam = this.state.exams.find((e) => e.session_id === prevSession.id);
        if (prevExam) {
          const passedAttempt = this.state.examAttempts.find(
            (a) => a.exam_id === prevExam.id && a.student_id === studentId && a.passed
          );
          if (!passedAttempt) {
            return {
              allowed: false,
              play_number: 0,
              remaining_plays: 0,
              reason: 'يجب عليك اجتياز امتحان الحصة السابقة أولاً بنجاح قبل مشاهدة هذه الحصة.',
            };
          }
        }
      }
    }

    const previousPlays = this.state.videoPlays.filter(
      (vp) => vp.session_id === sessionId && vp.student_id === studentId
    );

    if (previousPlays.length >= 3) {
      return {
        allowed: false,
        play_number: previousPlays.length,
        remaining_plays: 0,
        reason: 'تم استنفاد الحد الأقصى لمشاهدة فيديو هذه الحصة (3 مرات). تواصل مع الإدارة لطلب إعادة المحاولات.',
      };
    }

    const newPlayNumber = previousPlays.length + 1;
    const playId = 'vp-' + Date.now();
    const play: VideoPlay = {
      id: playId,
      session_id: sessionId,
      student_id: studentId,
      started_at: new Date().toISOString(),
      play_number: newPlayNumber,
      created_at: new Date().toISOString(),
    };

    this.state.videoPlays.push(play);
    this.persist();

    return {
      allowed: true,
      play_id: playId,
      play_number: newPlayNumber,
      remaining_plays: Math.max(0, 3 - newPlayNumber),
    };
  }

  getVideoPlays(sessionId: string, studentId: string): VideoPlay[] {
    return this.state.videoPlays.filter(
      (vp) => vp.session_id === sessionId && vp.student_id === studentId
    );
  }

  adminResetVideoPlays(sessionId: string, studentId: string): number {
    const beforeCount = this.state.videoPlays.length;
    this.state.videoPlays = this.state.videoPlays.filter(
      (vp) => !(vp.session_id === sessionId && vp.student_id === studentId)
    );
    const resetCount = beforeCount - this.state.videoPlays.length;
    this.persist();
    return resetCount;
  }

  // Exams & Attempts
  getExams(): Exam[] {
    return [...this.state.exams];
  }

  getExamsByGrade(gradeLevel: string): Exam[] {
    return this.state.exams.filter((e) => !e.grade_level || e.grade_level.includes(gradeLevel) || gradeLevel.includes(e.grade_level));
  }

  addExam(exam: Omit<Exam, 'id' | 'created_at'>): Exam {
    const newExam: Exam = {
      ...exam,
      id: 'ex-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    this.state.exams.push(newExam);
    this.persist();
    return newExam;
  }

  submitExamAttempt(data: {
    exam_id: string;
    student_id: string;
    student_name: string;
    parent_email: string;
    answers: Record<string, string>; // questionId -> selected choice string
  }): {
    score: number;
    total: number;
    pct: number;
    passed: boolean;
    attempt: ExamAttempt;
    review: {
      question: string;
      studentChoice: string;
      correctChoice: string;
      isCorrect: boolean;
      explanation: string;
    }[];
  } {
    const exam = this.state.exams.find((e) => e.id === data.exam_id);
    const questions = exam?.questions || [];
    let score = 0;
    const review: {
      question: string;
      studentChoice: string;
      correctChoice: string;
      isCorrect: boolean;
      explanation: string;
    }[] = [];

    questions.forEach((q) => {
      const studentAns = data.answers[q.id] || '';
      const isCorrect = studentAns.trim() === q.correct_answer.trim();
      if (isCorrect) {
        score += q.points;
      }
      review.push({
        question: q.question_text,
        studentChoice: studentAns || 'لم يتم الحل',
        correctChoice: q.correct_answer,
        isCorrect,
        explanation: q.explanation || 'الإجابة النموذجية تعتمد على المفاهيم العلمية المقررة.',
      });
    });

    const total = questions.reduce((sum, q) => sum + q.points, 0) || 1;
    const pct = Math.round((score / total) * 100);
    const passed = pct >= (exam?.passing_score || 70);

    const attempt: ExamAttempt = {
      id: 'att-' + Date.now(),
      exam_id: data.exam_id,
      student_id: data.student_id,
      score,
      total_score: total,
      passed,
      started_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      submitted_at: new Date().toISOString(),
      exam_title: exam?.title || 'اختبار',
      subject: exam?.subject || 'مادة علمية',
    };

    this.state.examAttempts.unshift(attempt);

    // Create Notification for Student
    this.addNotification({
      user_id: data.student_id,
      title: passed ? '🎉 مبارك! اجتياز الاختبار بنجاح' : '📝 نتيجة الاختبار',
      message: `أتممت ${exam?.title} وحصلت على ${score} من ${total} (${pct}%).`,
      notification_type: 'exam',
      related_url: `/exams/${exam?.id}`,
    });

    // Automated trigger log for parent report
    this.addAutomationLog({
      trigger_name: `Exam Submission -> Automation Parent Alert`,
      source: 'n8n',
      payload_summary: `إرسال تقرير نتيجة ${data.student_name} في "${exam?.title}" بنسبة ${pct}% لبريد ${data.parent_email}`,
      status: 'success',
      target_email: data.parent_email,
    });

    this.persist();

    return {
      score,
      total,
      pct,
      passed,
      attempt,
      review,
    };
  }

  getExamAttempts(studentId?: string): ExamAttempt[] {
    if (studentId) {
      return this.state.examAttempts.filter((a) => a.student_id === studentId);
    }
    return [...this.state.examAttempts];
  }

  // Assignments & Submissions
  getAssignments(groupId?: string): Assignment[] {
    if (groupId) {
      return this.state.assignments.filter((a) => a.group_id === groupId);
    }
    return [...this.state.assignments];
  }

  addAssignment(assignment: Omit<Assignment, 'id' | 'created_at'>): Assignment {
    const newAsg: Assignment = {
      ...assignment,
      id: 'asg-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    this.state.assignments.unshift(newAsg);
    this.persist();
    return newAsg;
  }

  getSubmissions(assignmentId?: string, studentId?: string): AssignmentSubmission[] {
    return this.state.submissions.filter((s) => {
      if (assignmentId && s.assignment_id !== assignmentId) return false;
      if (studentId && s.student_id !== studentId) return false;
      return true;
    });
  }

  submitAssignment(data: {
    assignment_id: string;
    student_id: string;
    submission_text?: string;
    file_url?: string;
  }): AssignmentSubmission {
    const asg = this.state.assignments.find((a) => a.id === data.assignment_id);
    const student = this.state.profiles.find((p) => p.id === data.student_id);

    // Existing check
    const existingIdx = this.state.submissions.findIndex(
      (s) => s.assignment_id === data.assignment_id && s.student_id === data.student_id
    );

    const submission: AssignmentSubmission = {
      id: existingIdx >= 0 ? this.state.submissions[existingIdx].id : 'sub-' + Date.now(),
      assignment_id: data.assignment_id,
      student_id: data.student_id,
      submission_text: data.submission_text,
      file_url: data.file_url || 'https://storage.eduflow.edu/uploads/homework.pdf',
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      student_name: student?.full_name,
      assignment_title: asg?.title,
      max_score: asg?.max_score || 20,
    };

    if (existingIdx >= 0) {
      this.state.submissions[existingIdx] = submission;
    } else {
      this.state.submissions.unshift(submission);
    }

    this.persist();
    return submission;
  }

  gradeSubmission(submissionId: string, score: number, feedback: string, teacherId: string): AssignmentSubmission | null {
    const sub = this.state.submissions.find((s) => s.id === submissionId);
    if (!sub) return null;

    sub.score = score;
    sub.teacher_feedback = feedback;
    sub.status = 'graded';
    sub.graded_at = new Date().toISOString();
    sub.graded_by = teacherId;

    // Notify student
    this.addNotification({
      user_id: sub.student_id,
      title: '🌟 تم تقييم واجبك المنزلي',
      message: `حصلت على ${score}/${sub.max_score} في واجب: ${sub.assignment_title}. ملاحظات المعلم: "${feedback}"`,
      notification_type: 'assignment',
    });

    this.persist();
    return sub;
  }

  // Attendance
  getAttendance(sessionId?: string, studentId?: string): Attendance[] {
    return this.state.attendance.filter((a) => {
      if (sessionId && a.session_id !== sessionId) return false;
      if (studentId && a.student_id !== studentId) return false;
      return true;
    });
  }

  recordAttendance(records: { session_id: string; student_id: string; status: 'present' | 'absent' | 'late' | 'excused'; recorded_by: string }[]) {
    records.forEach((r) => {
      const idx = this.state.attendance.findIndex(
        (a) => a.session_id === r.session_id && a.student_id === r.student_id
      );
      const student = this.state.profiles.find((p) => p.id === r.student_id);
      const session = this.state.sessions.find((s) => s.id === r.session_id);

      const entry: Attendance = {
        id: idx >= 0 ? this.state.attendance[idx].id : 'att-' + Date.now() + Math.random(),
        session_id: r.session_id,
        student_id: r.student_id,
        status: r.status,
        recorded_by: r.recorded_by,
        recorded_at: new Date().toISOString(),
        session_title: session?.title,
        session_number: session?.session_number,
        student_name: student?.full_name,
      };

      if (idx >= 0) {
        this.state.attendance[idx] = entry;
      } else {
        this.state.attendance.push(entry);
      }
    });

    this.persist();
  }

  // Payments & Invoices
  getStudentPayments(studentId?: string): StudentPayment[] {
    if (studentId) {
      return this.state.studentPayments.filter((p) => p.student_id === studentId);
    }
    return [...this.state.studentPayments];
  }

  getPaymentTransactions(paymentId?: string): PaymentTransaction[] {
    if (paymentId) {
      return this.state.paymentTransactions.filter((pt) => pt.student_payment_id === paymentId);
    }
    return [...this.state.paymentTransactions];
  }

  recordStudentPayment(paymentId: string, amount: number, method: 'cash' | 'instapay' | 'vodafone_cash' | 'bank_transfer' | 'other', recordedBy: string, notes?: string): { success: boolean; message: string } {
    const payment = this.state.studentPayments.find((p) => p.id === paymentId);
    if (!payment) return { success: false, message: 'الفاتورة غير موجودة' };
    if (payment.status === 'waived') return { success: false, message: 'لا يمكن تحصيل فاتورة معفاة' };
    if (payment.status === 'paid') return { success: false, message: 'الفاتورة مسددة بالكامل بالفعل' };

    const currentPaid = payment.paid_amount || 0;
    const remaining = payment.amount - currentPaid;
    if (amount > remaining) {
      return { success: false, message: `المبلغ المدخل (${amount}) يتجاوز المتبقي (${remaining})` };
    }

    const newPaid = currentPaid + amount;
    payment.paid_amount = newPaid;
    payment.remaining_amount = payment.amount - newPaid;
    payment.payment_method = method;
    payment.recorded_by = recordedBy;
    payment.notes = notes || payment.notes;

    if (newPaid >= payment.amount) {
      payment.status = 'paid';
      payment.paid_at = new Date().toISOString();
    } else {
      payment.status = 'partially_paid';
    }

    // Add transaction record
    this.state.paymentTransactions.push({
      id: 'pt-' + Date.now(),
      student_payment_id: paymentId,
      amount,
      payment_method: method,
      paid_at: new Date().toISOString(),
      recorded_by: recordedBy,
      notes,
      created_at: new Date().toISOString(),
    });

    // Notify Student
    this.addNotification({
      user_id: payment.student_id,
      title: '💳 تم تسجيل سداد مالي',
      message: `تم توثيق سداد مبلغ ${amount} ${payment.currency} عبر ${method}. الحالة الحالية: ${payment.status === 'paid' ? 'مسدد بالكامل' : 'مسدد جزئياً'}.`,
      notification_type: 'payment',
    });

    this.persist();
    return { success: true, message: 'تم تسجيل السداد بنجاح' };
  }

  waiveStudentPayment(paymentId: string, reason: string, waivedBy: string): { success: boolean; message: string } {
    const payment = this.state.studentPayments.find((p) => p.id === paymentId);
    if (!payment) return { success: false, message: 'الفاتورة غير موجودة' };
    if (!reason || reason.trim().length === 0) return { success: false, message: 'سبب الإعفاء مطلوب إلزامياً' };

    payment.status = 'waived';
    payment.waived_reason = reason.trim();
    payment.waived_at = new Date().toISOString();
    payment.waived_by = waivedBy;

    this.persist();
    return { success: true, message: 'تم إعفاء الفاتورة بنجاح' };
  }

  // Teacher Earnings
  getTeacherEarnings(teacherId?: string): TeacherEarning[] {
    if (teacherId) {
      return this.state.teacherEarnings.filter((e) => e.teacher_id === teacherId);
    }
    return [...this.state.teacherEarnings];
  }

  approveTeacherEarning(earningId: string) {
    const e = this.state.teacherEarnings.find((te) => te.id === earningId);
    if (e && e.status === 'pending') {
      e.status = 'approved';
      this.persist();
    }
  }

  payTeacherEarning(earningId: string) {
    const e = this.state.teacherEarnings.find((te) => te.id === earningId);
    if (e && (e.status === 'approved' || e.status === 'pending')) {
      e.status = 'paid';
      e.paid_at = new Date().toISOString();
      this.persist();
    }
  }

  // Complaints
  getComplaints(userId?: string): Complaint[] {
    if (userId) {
      const user = this.state.profiles.find((p) => p.id === userId);
      if (user?.role === 'admin') {
        return [...this.state.complaints];
      }
      return this.state.complaints.filter((c) => c.submitted_by === userId);
    }
    return [...this.state.complaints];
  }

  submitComplaint(data: {
    submitted_by: string;
    subject: string;
    description: string;
    category?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
  }): Complaint {
    const user = this.state.profiles.find((p) => p.id === data.submitted_by);
    const complaint: Complaint = {
      id: 'comp-' + Date.now(),
      submitted_by: data.submitted_by,
      subject: data.subject,
      description: data.description,
      category: data.category || 'عام',
      priority: data.priority || 'normal',
      status: 'open',
      created_at: new Date().toISOString(),
      submitter_name: user?.full_name,
      submitter_role: user?.role,
    };

    this.state.complaints.unshift(complaint);
    this.persist();
    return complaint;
  }

  updateComplaint(id: string, status: 'open' | 'in_progress' | 'resolved' | 'closed', adminResponse?: string, assignedTo?: string) {
    const c = this.state.complaints.find((comp) => comp.id === id);
    if (c) {
      c.status = status;
      if (adminResponse) c.admin_response = adminResponse;
      if (assignedTo) {
        c.assigned_to = assignedTo;
        const admin = this.state.profiles.find((p) => p.id === assignedTo);
        c.assigned_name = admin?.full_name;
      }
      if (status === 'resolved' || status === 'closed') {
        c.resolved_at = new Date().toISOString();
      }

      // Notify Submitter
      this.addNotification({
        user_id: c.submitted_by,
        title: '📩 تحديث بشأن شكواك/طلبك',
        message: `تم تحديث حالة تذكرتك "${c.subject}" إلى: ${status === 'resolved' ? 'تم الحل بنجاح' : status}.`,
        notification_type: 'complaint',
      });

      this.persist();
    }
  }

  // Notifications
  getNotifications(userId: string): AppNotification[] {
    return this.state.notifications.filter((n) => n.user_id === userId);
  }

  getUnreadCount(userId: string): number {
    return this.state.notifications.filter((n) => n.user_id === userId && !n.is_read).length;
  }

  markNotificationRead(id: string) {
    const n = this.state.notifications.find((notif) => notif.id === id);
    if (n) {
      n.is_read = true;
      this.persist();
    }
  }

  markAllNotificationsRead(userId: string) {
    this.state.notifications.forEach((n) => {
      if (n.user_id === userId) {
        n.is_read = true;
      }
    });
    this.persist();
  }

  addNotification(notif: {
    user_id: string;
    title: string;
    message: string;
    notification_type?: any;
    type?: any;
    related_url?: string;
  }) {
    this.state.notifications.unshift({
      id: 'notif-' + Date.now() + Math.random(),
      user_id: notif.user_id,
      title: notif.title,
      message: notif.message,
      notification_type: notif.notification_type || notif.type || 'general',
      type: notif.type || notif.notification_type || 'general',
      is_read: false,
      related_url: notif.related_url,
      created_at: new Date().toISOString(),
    });
    this.persist();
  }

  // Course Materials & RAG
  getCourseMaterials(): CourseMaterial[] {
    return [...this.state.courseMaterials];
  }

  getMaterials(groupId?: string): CourseMaterial[] {
    if (!groupId) return [...this.state.courseMaterials];
    return this.state.courseMaterials.filter((m) => !m.group_id || m.group_id === groupId);
  }

  addCourseMaterial(data: Omit<CourseMaterial, 'id' | 'created_at' | 'rag_status' | 'rag_chunk_count'>): CourseMaterial {
    const mat: CourseMaterial = {
      ...data,
      id: 'mat-' + Date.now(),
      created_at: new Date().toISOString(),
      rag_status: 'completed',
      rag_chunk_count: Math.floor(Math.random() * 20) + 8,
      rag_processed_at: new Date().toISOString(),
    };
    this.state.courseMaterials.push(mat);

    this.addAutomationLog({
      trigger_name: 'RAG Ingestion: File Embedded',
      source: 'gemini',
      payload_summary: `تم تقطيع وفهرسة ملف "${mat.title}" إلى ${mat.rag_chunk_count} مقطع متزن.`,
      status: 'success',
    });

    this.persist();
    return mat;
  }

  // Student Notes
  getStudentNotes(studentId: string): StudentNote[] {
    return this.state.studentNotes.filter((n) => n.student_id === studentId);
  }

  addStudentNote(studentId: string, teacherId: string, groupId: string, note: string): StudentNote {
    const teacher = this.state.profiles.find((p) => p.id === teacherId);
    const student = this.state.profiles.find((p) => p.id === studentId);
    const entry: StudentNote = {
      id: 'sn-' + Date.now(),
      student_id: studentId,
      teacher_id: teacherId,
      group_id: groupId,
      note,
      created_at: new Date().toISOString(),
      teacher_name: teacher?.full_name,
      student_name: student?.full_name,
    };
    this.state.studentNotes.unshift(entry);
    this.persist();
    return entry;
  }

  // Automation Logs
  getAutomationLogs(): AutomationLog[] {
    return [...this.state.automationLogs];
  }

  addAutomationLog(log: Omit<AutomationLog, 'id' | 'timestamp'>) {
    this.state.automationLogs.unshift({
      ...log,
      id: 'aut-' + Date.now(),
      timestamp: new Date().toISOString(),
    });
    this.persist();
  }

  // AI Chat Conversations & Messages
  getAiMessages(userId: string): AiMessage[] {
    let conv = this.state.aiConversations.find((c) => c.user_id === userId);
    if (!conv) {
      conv = {
        id: 'conv-' + Date.now(),
        user_id: userId,
        title: 'مساعد EduFlow الذكي',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.state.aiConversations.push(conv);
      this.persist();
    }
    return this.state.aiMessages.filter((m) => m.conversation_id === conv!.id);
  }

  sendAiMessage(userId: string, userText: string): { userMsg: AiMessage; assistantMsg: AiMessage } {
    let conv = this.state.aiConversations.find((c) => c.user_id === userId);
    if (!conv) {
      conv = {
        id: 'conv-' + Date.now(),
        user_id: userId,
        title: 'مساعد EduFlow الذكي',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.state.aiConversations.push(conv);
    }

    const userMsg: AiMessage = {
      id: 'msg-' + Date.now(),
      conversation_id: conv.id,
      sender: 'user',
      message: userText,
      created_at: new Date().toISOString(),
    };
    this.state.aiMessages.push(userMsg);

    // Realistic RAG Tutor intelligence based on context
    let reply = '';
    const qLower = userText.toLowerCase();
    if (qLower.includes('قلب') || qLower.includes('دوري') || qLower.includes('دم')) {
      reply = `أهلاً بك! بالرجوع لمقرر العلوم والجهاز الدوري: القلب عضو عضلي يتكون من 4 حجرات (أذينان وبطينان). الشرايين تنقل الدم بعيداً عن القلب، والأوردة تعيده، والصفائح الدموية تمنع النزيف بتكوين الجلطة الواقية. هل تحب مراجعة أسئلة الكويز المرتبطة؟`;
    } else if (qLower.includes('ذرة') || qLower.includes('الكترون') || qLower.includes('بروتون')) {
      reply = `بالنسبة للتركيب الذري: تتكون الذرة من نواة مركزية بها بروتونات موجبة (+) ونيوترونات متعادلة (±)، وتدور حولها إلكترونات سالبة (-) في مستويات الطاقة السبعة (K, L, M, N, O, P, Q). المستوى الأول يتشبع بإلكترونين فقط (2n²).`;
    } else if (qLower.includes('امتحان') || qLower.includes('درجة') || qLower.includes('شهادة')) {
      reply = `جميع درجاتك وتقارير أدائك موثقة بشكل آلي في المنظومة، وتُرسل مباشرة لولي أمرك عبر بريده الإلكتروني بمجرد تسليم الاختبار. يمكنك حل الاختبارات المنشورة في صفحتك الرئيسية في أي وقت.`;
    } else {
      reply = `مرحباً بك! أنا مساعد EduFlow الأكاديمي الذكي المربوط بمقرراتك وموادك الدراسية. يمكنك سؤالي عن أي مفهوم علمي، أو طلب تلخيص نقطة معينة، أو الاستفسار عن الواجبات والامتحانات القادمة.`;
    }

    const assistantMsg: AiMessage = {
      id: 'msg-' + (Date.now() + 1),
      conversation_id: conv.id,
      sender: 'assistant',
      message: reply,
      created_at: new Date().toISOString(),
    };
    this.state.aiMessages.push(assistantMsg);

    this.persist();
    return { userMsg, assistantMsg };
  }

  // ==========================================
  // OPERATIONAL ASSISTANT & COORDINATOR METHODS
  // ==========================================

  registerStudentByAssistant(data: {
    full_name: string;
    email: string;
    phone?: string;
    grade_level?: string;
    parent_name?: string;
    parent_phone?: string;
    parent_email?: string;
    group_id?: string;
  }): Profile {
    const studentId = 'stu-' + (this.state.profiles.filter((p) => p.role === 'student').length + 1) + '-' + Math.floor(Math.random() * 1000);
    const newStudent: Profile = {
      id: studentId,
      full_name: data.full_name,
      email: data.email || `${studentId}@eduflow.edu`,
      phone: data.phone || '010' + Math.floor(10000000 + Math.random() * 90000000),
      role: 'student',
      avatar: '👨‍🎓',
      grade_level: data.grade_level || 'الصف الثاني الإعدادي',
      parent_name: data.parent_name || 'ولي أمر الطالب',
      parent_email: data.parent_email || `${studentId}.parent@gmail.com`,
      created_at: new Date().toISOString(),
    };

    this.state.profiles.push(newStudent);

    // If parent info provided, create or link parent
    if (data.parent_name || data.parent_email) {
      let parent = this.state.profiles.find((p) => p.role === 'parent' && p.email === data.parent_email);
      if (!parent) {
        const parentId = 'par-' + (this.state.profiles.filter((p) => p.role === 'parent').length + 1);
        parent = {
          id: parentId,
          full_name: data.parent_name || 'أ. ولي أمر ' + data.full_name,
          email: data.parent_email || `${parentId}@gmail.com`,
          phone: data.parent_phone || data.phone || '01000000000',
          role: 'parent',
          avatar: '👨‍💼',
          created_at: new Date().toISOString(),
        };
        this.state.profiles.push(parent);
      }
      newStudent.parent_id = parent.id;
      this.state.parentLinks.push({
        id: 'pl-' + Date.now(),
        parent_id: parent.id,
        student_id: newStudent.id,
        status: 'approved',
        created_at: new Date().toISOString(),
      });
    }

    // If group provided, create enrollment and initial monthly fee
    if (data.group_id) {
      const group = this.state.groups.find((g) => g.id === data.group_id);
      this.state.enrollments.push({
        id: 'enr-' + Date.now(),
        student_id: newStudent.id,
        group_id: data.group_id,
        enrolled_at: new Date().toISOString(),
        status: 'active',
        student_name: newStudent.full_name,
        group_name: group?.name,
      });

      // Create initial billing invoice
      this.state.studentPayments.push({
        id: 'inv-' + Date.now(),
        student_id: newStudent.id,
        group_id: data.group_id,
        amount: 450,
        currency: 'EGP',
        paid_amount: 0,
        remaining_amount: 450,
        amount_due: 450,
        amount_paid: 0,
        status: 'unpaid',
        period_label: 'شهر نوفمبر 2026',
        cycle_month: '2026-11-01',
        due_date: '2026-11-20',
        created_at: new Date().toISOString(),
        student_name: newStudent.full_name,
        group_name: group?.name,
      });
    }

    // Add welcoming notification
    this.addNotification({
      user_id: newStudent.id,
      title: 'مرحباً بك في منصة EduFlow 🎓',
      message: `تم تسجيل حسابك بنجاح بواسطة المنسق الإداري، وانضمامك لمجموعتك الدراسية. يمكنك الآن استعراض الحصص والواجبات.`,
      type: 'info',
    });

    this.persist();
    return newStudent;
  }

  uploadMaterialByAssistant(data: {
    group_id: string;
    title: string;
    file_url?: string;
    file_type?: string;
    session_id?: string;
    description?: string;
  }): CourseMaterial {
    const group = this.state.groups.find((g) => g.id === data.group_id);
    const newMaterial: CourseMaterial = {
      id: 'mat-' + Date.now(),
      group_id: data.group_id,
      session_id: data.session_id,
      title: data.title,
      file_url: data.file_url || 'https://eduflow.edu/materials/' + Date.now() + '.pdf',
      file_type: data.file_type || 'PDF',
      download_count: 0,
      created_at: new Date().toISOString(),
    };

    this.state.courseMaterials.push(newMaterial);

    // Notify students of that group
    const enrolledStudentIds = this.state.enrollments
      .filter((e) => e.group_id === data.group_id && e.status === 'active')
      .map((e) => e.student_id);

    enrolledStudentIds.forEach((stuId) => {
      this.addNotification({
        user_id: stuId,
        title: 'تم رفع مذكرة دراسية جديدة 📚',
        message: `قام المساعد الإداري برفع "${data.title}" لمجموعة ${group?.name || ''}. يمكنك تحميلها ومراجعتها الآن.`,
        type: 'info',
      });
    });

    this.persist();
    return newMaterial;
  }

  recordBatchAttendanceByAssistant(
    sessionId: string,
    records: { student_id: string; status: 'present' | 'absent' | 'late' | 'excused'; notes?: string }[]
  ) {
    const session = this.state.sessions.find((s) => s.id === sessionId);
    records.forEach((rec) => {
      const existing = this.state.attendance.find(
        (a) => a.session_id === sessionId && a.student_id === rec.student_id
      );

      if (existing) {
        existing.status = rec.status;
        existing.notes = rec.notes || existing.notes;
        existing.recorded_at = new Date().toISOString();
      } else {
        this.state.attendance.push({
          id: 'att-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
          session_id: sessionId,
          student_id: rec.student_id,
          status: rec.status,
          notes: rec.notes || 'تم الرصد بواسطة المساعد الإداري',
          recorded_at: new Date().toISOString(),
        });
      }

      // If marked absent, send immediate notification to student and parent
      if (rec.status === 'absent') {
        const student = this.state.profiles.find((p) => p.id === rec.student_id);
        this.addNotification({
          user_id: rec.student_id,
          title: 'تنبيه غياب الحصة ⚠️',
          message: `تم تسجيل غيابك اليوم في حصة "${session?.title || 'الحصة الدراسية'}". يرجى مراجعة إدارة السنتر لتحديد موعد التعويض.`,
          type: 'warning',
        });
        if (student?.parent_id) {
          this.addNotification({
            user_id: student.parent_id,
            title: 'إشعار غياب لولي الأمر ⚠️',
            message: `نحيط سيادتكم علماً بتسجيل غياب الطالب (${student.full_name}) اليوم في حصة "${session?.title || 'المادة'}".`,
            type: 'warning',
          });
        }
      }
    });

    this.persist();
  }

  recordPaymentVoucherByAssistant(data: {
    student_payment_id: string;
    amount: number;
    payment_method: 'cash' | 'instapay' | 'vodafone_cash' | 'bank_transfer' | 'other';
    reference_number?: string;
    notes?: string;
    assistant_name?: string;
  }): { success: boolean; invoice?: StudentPayment; transaction?: PaymentTransaction } {
    const invoice = this.state.studentPayments.find((p) => p.id === data.student_payment_id);
    if (!invoice) return { success: false };

    const transaction: PaymentTransaction = {
      id: 'tx-' + Date.now(),
      student_payment_id: invoice.id,
      amount: data.amount,
      payment_method: data.payment_method,
      reference_number: data.reference_number || 'OP-' + Math.floor(100000 + Math.random() * 900000),
      notes: (data.notes || '') + ` (رصد المنسق: ${data.assistant_name || 'أ. كريم نبيل'})`,
      paid_at: new Date().toISOString(),
      recorded_by: data.assistant_name || 'ast-1',
      created_at: new Date().toISOString(),
    };

    this.state.paymentTransactions.push(transaction);

    invoice.paid_amount = (invoice.paid_amount || 0) + data.amount;
    invoice.amount_paid = invoice.paid_amount;
    const targetDue = invoice.amount || invoice.amount_due || 450;
    if (invoice.paid_amount >= targetDue) {
      invoice.status = 'paid';
    } else if (invoice.paid_amount > 0) {
      invoice.status = 'partially_paid';
    }
    invoice.remaining_amount = Math.max(0, targetDue - invoice.paid_amount);

    const student = this.state.profiles.find((p) => p.id === invoice.student_id);

    // Send notifications
    const methodNames: Record<string, string> = {
      cash: 'نقداً بالسنتر',
      instapay: 'انستاباي Instapay',
      vodafone_cash: 'فودافون كاش',
      bank_transfer: 'تحويل بنكي',
      other: 'سداد إلكتروني',
    };

    const notifMsg = `تم استلام وتأكيد سداد مبلغ ${data.amount} ج.م بطريقة (${methodNames[data.payment_method] || data.payment_method}) برقم إيصال ${transaction.reference_number}. تم تحديث حالة الفاتورة.`;

    this.addNotification({
      user_id: invoice.student_id,
      title: 'سند قبض ودفع معتمد 🧾',
      message: notifMsg,
      type: 'success',
    });

    if (student?.parent_id) {
      this.addNotification({
        user_id: student.parent_id,
        title: 'تأكيد استلام مصروفات دراسية 🧾',
        message: `عزيزي ولي أمر الطالب (${student.full_name}): ${notifMsg}`,
        type: 'success',
      });
    }

    this.persist();
    return { success: true, invoice, transaction };
  }

  resolveComplaintByAssistant(
    complaintId: string,
    resolutionNotes: string,
    status: 'in_progress' | 'resolved' = 'resolved',
    assistantName: string = 'أ. كريم نبيل (المنسق الإداري)'
  ): boolean {
    const complaint = this.state.complaints.find((c) => c.id === complaintId);
    if (!complaint) return false;

    complaint.status = status;
    complaint.resolved_at = status === 'resolved' ? new Date().toISOString() : undefined;
    complaint.assigned_to = 'ast-1';

    const fullReply = `[رد المنسق ${assistantName}]: ${resolutionNotes}`;

    this.addNotification({
      user_id: complaint.submitted_by || complaint.user_id || '',
      title: status === 'resolved' ? 'تم حل شكواك / استفسارك بنجاح ✅' : 'تحديث بخصوص طلبك ℹ️',
      message: fullReply,
      type: status === 'resolved' ? 'success' : 'info',
    });

    this.persist();
    return true;
  }

  sendOperationalBroadcast(data: {
    title: string;
    message: string;
    target_group_id?: string;
    target_role?: 'all' | 'student' | 'parent';
  }) {
    let targetUserIds: string[] = [];

    if (data.target_group_id && data.target_group_id !== 'all') {
      const enrollments = this.state.enrollments.filter(
        (e) => e.group_id === data.target_group_id && e.status === 'active'
      );
      const studentIds = enrollments.map((e) => e.student_id);
      if (data.target_role === 'student' || data.target_role === 'all' || !data.target_role) {
        targetUserIds.push(...studentIds);
      }
      if (data.target_role === 'parent' || data.target_role === 'all') {
        const parentIds = this.state.profiles
          .filter((p) => studentIds.includes(p.id) && p.parent_id)
          .map((p) => p.parent_id as string);
        targetUserIds.push(...parentIds);
      }
    } else {
      if (data.target_role === 'student' || data.target_role === 'all' || !data.target_role) {
        targetUserIds.push(...this.getStudents().map((s) => s.id));
      }
      if (data.target_role === 'parent' || data.target_role === 'all') {
        targetUserIds.push(...this.getParents().map((p) => p.id));
      }
    }

    // Deduplicate
    targetUserIds = Array.from(new Set(targetUserIds));

    targetUserIds.forEach((uid) => {
      this.addNotification({
        user_id: uid,
        title: `📢 ${data.title}`,
        message: data.message,
        type: 'info',
      });
    });

    this.persist();
    return targetUserIds.length;
  }

  // ==========================================
  // EXAM CREATION (AI, MANUAL, MATERIAL UPLOAD)
  // ==========================================
  createExamWithQuestions(data: {
    session_id: string;
    title: string;
    subject?: string;
    grade_level?: string;
    duration_minutes: number;
    passing_score: number;
    creator_role: 'teacher' | 'assistant' | 'admin';
    creation_mode: 'manual' | 'ai_generated' | 'material_upload';
    curriculum_type?: 'languages' | 'arabic';
    material_url?: string;
    questions?: Omit<Question, 'id' | 'exam_id'>[];
  }): Exam {
    const examId = 'ex-' + Date.now();
    const createdQuestions: Question[] = (data.questions || []).map((q, idx) => ({
      id: `q-${examId}-${idx + 1}`,
      exam_id: examId,
      question_text: q.question_text,
      question_type: q.question_type || 'mcq',
      options: q.options,
      correct_answer: q.correct_answer,
      points: q.points || 1,
      explanation: q.explanation || 'إجابة نموذجية وشرح تفصيلي للمفهوم العلمي.',
    }));

    const newExam: Exam = {
      id: examId,
      session_id: data.session_id,
      title: data.title,
      subject: data.subject || 'Sciences (Languages / لغات)',
      grade_level: data.grade_level || 'الصف الثاني الإعدادي',
      duration_minutes: data.duration_minutes || 15,
      passing_score: data.passing_score || 70,
      is_published: true,
      creator_role: data.creator_role,
      creation_mode: data.creation_mode,
      curriculum_type: data.curriculum_type || 'languages',
      material_url: data.material_url,
      questions: createdQuestions,
      created_at: new Date().toISOString(),
    };

    this.state.exams.unshift(newExam);

    // Notify enrolled students in group
    const session = this.state.sessions.find((s) => s.id === data.session_id);
    if (session) {
      const enrollments = this.state.enrollments.filter((e) => e.group_id === session.group_id);
      enrollments.forEach((e) => {
        this.addNotification({
          user_id: e.student_id,
          title: `📝 اختبار جديد: ${newExam.title}`,
          message: `تم نشر اختبار جديد للحصة (${session.title}). يمكنك خوض الاختبار الآن والحصول على التقييم.`,
          notification_type: 'exam',
        });
      });
    }

    this.persist();
    return newExam;
  }

  // ==========================================
  // STUDENT ACADEMIC TRACKER FOR ASSISTANT
  // (Who took exam? Who watched video? Who solved homework?)
  // ==========================================
  getStudentAcademicFollowUp(groupId: string, sessionId?: string): StudentFollowUpRecord[] {
    const enrollments = this.state.enrollments.filter((e) => e.group_id === groupId && e.status === 'active');
    const studentIds = enrollments.map((e) => e.student_id);
    const students = this.state.profiles.filter((p) => studentIds.includes(p.id));

    let exam: Exam | undefined;
    if (sessionId) {
      exam = this.state.exams.find((ex) => ex.session_id === sessionId);
    }
    if (!exam) {
      const groupSessions = this.state.sessions.filter((s) => s.group_id === groupId);
      const sessionIds = groupSessions.map((s) => s.id);
      exam = this.state.exams.find((ex) => sessionIds.includes(ex.session_id)) || this.state.exams[0];
    }

    const assignment = this.state.assignments.find((a) => (sessionId ? a.session_id === sessionId : a.group_id === groupId));

    return students.map((stu) => {
      const targetSessionId = sessionId || (this.state.sessions.find((s) => s.group_id === groupId)?.id || 'sess-1');
      const plays = this.getVideoPlays(targetSessionId, stu.id);
      const playCount = plays.length;

      let examTaken = false;
      let examScore: number | undefined;
      let examTotal: number | undefined;
      let examPassed: boolean | undefined;
      if (exam) {
        const attempt = this.state.examAttempts.find((att) => att.exam_id === exam!.id && att.student_id === stu.id);
        if (attempt) {
          examTaken = true;
          examScore = attempt.score;
          examTotal = attempt.total_score;
          examPassed = attempt.passed;
        }
      }

      let assignmentSubmitted = false;
      let assignmentScore: number | undefined;
      if (assignment) {
        const sub = this.state.submissions.find((s) => s.assignment_id === assignment.id && s.student_id === stu.id);
        if (sub) {
          assignmentSubmitted = true;
          assignmentScore = sub.score;
        }
      }

      const att = this.state.attendance.find((a) => a.session_id === targetSessionId && a.student_id === stu.id);

      const inv = this.state.studentPayments.find((p) => p.student_id === stu.id && p.group_id === groupId) ||
                  this.state.studentPayments.find((p) => p.student_id === stu.id);

      const due = inv ? (inv.amount || inv.amount_due || 450) : 450;
      const paid = inv ? (inv.paid_amount || inv.amount_paid || 0) : 0;
      const rem = inv?.remaining_amount ?? Math.max(0, due - paid);
      const payStatus = inv ? inv.status : 'unpaid';
      const payMethod = inv?.payment_method || 'لم يسجل';

      return {
        student_id: stu.id,
        student_name: stu.full_name,
        student_code: `#${stu.id}`,
        phone: stu.phone,
        parent_name: stu.parent_name || 'أ. ولي الأمر',
        parent_phone: stu.phone ? stu.phone.replace(/5/g, '6') : '01012345678',
        grade_level: stu.grade_level,
        video_watched: playCount > 0,
        video_play_count: playCount,
        max_plays: 3,
        exam_taken: examTaken,
        exam_score: examScore,
        exam_total: examTotal,
        exam_passed: examPassed,
        assignment_submitted: assignmentSubmitted,
        assignment_score: assignmentScore,
        attendance_status: att ? att.status : undefined,
        amount_due: due,
        amount_paid: paid,
        remaining_amount: rem,
        payment_status: payStatus,
        payment_method: payMethod,
      };
    });
  }

  // ==========================================
  // DIRECT PARENT LIAISON COMMUNICATION BRIDGE
  // ==========================================
  sendParentFollowUpMessage(
    studentId: string,
    issueType: 'missing_exam' | 'missing_homework' | 'missing_video' | 'fees',
    customMessage?: string
  ): { success: boolean; studentName: string; parentPhone: string; whatsappUrl: string; messageText: string } {
    const student = this.state.profiles.find((p) => p.id === studentId);
    if (!student) {
      return { success: false, studentName: '', parentPhone: '', whatsappUrl: '', messageText: '' };
    }

    let defaultMsg = '';
    if (issueType === 'missing_exam') {
      defaultMsg = `عزيزي ولي أمر الطالب (${student.full_name}): نحيط سيادتكم علماً بأن الطالب لم يدخل اختبار الحصة بعد. نرجو التنبيه عليه بضرورة أداء الاختبار على المنصة لتقييم مستواه.`;
    } else if (issueType === 'missing_homework') {
      defaultMsg = `عزيزي ولي أمر الطالب (${student.full_name}): نود إعلامكم بعدم تسليم الطالب لواجب الحصة المنزلية (Assignment). يرجى المتابعة لضمان استمرار تفوقه.`;
    } else if (issueType === 'missing_video') {
      defaultMsg = `عزيزي ولي أمر الطالب (${student.full_name}): الطالب لم يشاهد فيديو شرح الحصة على المنصة حتى الآن. يرجى التنبيه بالمشاهدة والحل.`;
    } else {
      defaultMsg = `عزيزي ولي أمر الطالب (${student.full_name}): تذكير لطيف بمصروفات الشهر الدراسي المعلقة. يمكنكم السداد عبر فودافون كاش أو انستاباي أو بالسنتر.`;
    }

    const messageText = customMessage || defaultMsg;
    const parentPhone = student.phone || '01012345678';
    const cleanPhone = parentPhone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/2${cleanPhone}?text=${encodeURIComponent(messageText)}`;

    this.addNotification({
      user_id: student.id,
      title: 'تنبيه متابعة إدارية 📋',
      message: messageText,
      notification_type: 'general',
    });

    if (student.parent_id) {
      this.addNotification({
        user_id: student.parent_id,
        title: 'رسالة متابعة من المنسق الإداري 📱',
        message: messageText,
        notification_type: 'general',
      });
    }

    this.persist();
    return {
      success: true,
      studentName: student.full_name,
      parentPhone,
      whatsappUrl,
      messageText,
    };
  }
}

export const db = new MockDatabaseService();
