


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."add_ai_chat_message"("p_conversation_id" "uuid", "p_message" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_message_id UUID;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF p_message IS NULL OR LENGTH(TRIM(p_message)) = 0 THEN
        RAISE EXCEPTION 'Message cannot be empty';
    END IF;

    IF LENGTH(p_message) > 12000 THEN
        RAISE EXCEPTION 'Message is too long';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.ai_conversations
        WHERE id = p_conversation_id
          AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Conversation not found or access denied';
    END IF;

    INSERT INTO public.ai_messages (
        conversation_id,
        sender,
        message
    )
    VALUES (
        p_conversation_id,
        'user',
        TRIM(p_message)
    )
    RETURNING id INTO v_message_id;

    UPDATE public.ai_conversations
    SET updated_at = NOW()
    WHERE id = p_conversation_id;

    RETURN v_message_id;
END;
$$;


ALTER FUNCTION "public"."add_ai_chat_message"("p_conversation_id" "uuid", "p_message" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_assign_complaint"("p_complaint_id" "uuid", "p_admin_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = p_admin_id
          AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Assigned user must be an admin';
    END IF;

    UPDATE public.complaints
    SET assigned_to = p_admin_id,
        status = CASE
            WHEN status = 'open' THEN 'in_progress'
            ELSE status
        END
    WHERE id = p_complaint_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Complaint not found';
    END IF;

    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."admin_assign_complaint"("p_complaint_id" "uuid", "p_admin_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_generate_group_invoices"("p_group_id" "uuid", "p_period_label" "text", "p_due_date" "date", "p_session_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    v_payment_type TEXT;
    v_amount NUMERIC;
    v_currency TEXT;
    v_session_number INTEGER;
    v_created INTEGER := 0;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    SELECT payment_type, amount, currency
    INTO v_payment_type, v_amount, v_currency
    FROM public.group_billing_settings
    WHERE group_id = p_group_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Group billing settings not found';
    END IF;

    IF v_payment_type = 'per_session' THEN

        IF p_session_id IS NULL THEN
            RAISE EXCEPTION
                'A session ID is required for per-session billing';
        END IF;

        SELECT session_number
        INTO v_session_number
        FROM public.sessions
        WHERE id = p_session_id
          AND group_id = p_group_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION
                'Session does not belong to this group';
        END IF;

        IF EXISTS (
            SELECT 1
            FROM public.student_payments
            WHERE group_id = p_group_id
              AND session_id = p_session_id
              AND status = 'waived'
        ) THEN
            RAISE EXCEPTION
                'A waived invoice already exists for this session';
        END IF;

        INSERT INTO public.student_payments (
            student_id,
            group_id,
            session_id,
            amount,
            currency,
            period_label,
            due_date,
            status
        )
        SELECT
            e.student_id,
            p_group_id,
            p_session_id,
            v_amount,
            v_currency,
            'Session ' || v_session_number,
            p_due_date,
            'unpaid'
        FROM public.enrollments e
        WHERE e.group_id = p_group_id
          AND e.status = 'active'
        ON CONFLICT DO NOTHING;

    ELSE

        IF p_session_id IS NOT NULL THEN
            RAISE EXCEPTION
                'Session ID must be NULL for period-based billing';
        END IF;

        IF p_period_label IS NULL
           OR LENGTH(TRIM(p_period_label)) = 0 THEN
            RAISE EXCEPTION
                'Period label is required';
        END IF;

        INSERT INTO public.student_payments (
            student_id,
            group_id,
            session_id,
            amount,
            currency,
            period_label,
            due_date,
            status
        )
        SELECT
            e.student_id,
            p_group_id,
            NULL,
            v_amount,
            v_currency,
            TRIM(p_period_label),
            p_due_date,
            'unpaid'
        FROM public.enrollments e
        WHERE e.group_id = p_group_id
          AND e.status = 'active'
        ON CONFLICT DO NOTHING;

    END IF;

    GET DIAGNOSTICS v_created = ROW_COUNT;

    RETURN jsonb_build_object(
        'success', TRUE,
        'group_id', p_group_id,
        'payment_type', v_payment_type,
        'created_invoices', v_created,
        'period_label', p_period_label,
        'session_id', p_session_id
    );
END;
$$;


ALTER FUNCTION "public"."admin_generate_group_invoices"("p_group_id" "uuid", "p_period_label" "text", "p_due_date" "date", "p_session_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_generate_session_earning"("p_session_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    v_group_id UUID;
    v_teacher_id UUID;
    v_compensation_type TEXT;
    v_amount NUMERIC;
    v_currency TEXT;
    v_earning_id UUID;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    SELECT group_id
    INTO v_group_id
    FROM public.sessions
    WHERE id = p_session_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Session not found';
    END IF;

    SELECT
        cg.teacher_id,
        tc.compensation_type,
        tc.amount,
        tc.currency
    INTO
        v_teacher_id,
        v_compensation_type,
        v_amount,
        v_currency
    FROM public.course_groups cg
    JOIN public.teacher_compensation tc
      ON tc.group_id = cg.id
     AND tc.teacher_id = cg.teacher_id
    WHERE cg.id = v_group_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'Teacher compensation settings not found';
    END IF;

    IF v_compensation_type <> 'per_session' THEN
        RAISE EXCEPTION
            'This function only processes per-session compensation';
    END IF;

    INSERT INTO public.teacher_earnings (
        teacher_id,
        group_id,
        session_id,
        amount,
        currency,
        description,
        status
    )
    VALUES (
        v_teacher_id,
        v_group_id,
        p_session_id,
        v_amount,
        v_currency,
        'Earnings for session',
        'pending'
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_earning_id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'created', v_earning_id IS NOT NULL,
        'earning_id', v_earning_id,
        'teacher_id', v_teacher_id,
        'amount', v_amount,
        'currency', v_currency
    );
END;
$$;


ALTER FUNCTION "public"."admin_generate_session_earning"("p_session_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_refresh_overdue_payments"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    v_count INTEGER;
BEGIN

    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    UPDATE public.student_payments
    SET status = 'overdue'
    WHERE status IN (
        'unpaid',
        'partially_paid'
    )
    AND due_date < CURRENT_DATE;

    GET DIAGNOSTICS v_count = ROW_COUNT;

    RETURN v_count;

END;
$$;


ALTER FUNCTION "public"."admin_refresh_overdue_payments"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_reset_video_plays"("p_student_id" "uuid", "p_session_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can reset video plays';
    END IF;

    DELETE FROM public.video_plays
    WHERE student_id = p_student_id
      AND session_id = p_session_id;

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    RETURN v_deleted_count;
END;
$$;


ALTER FUNCTION "public"."admin_reset_video_plays"("p_student_id" "uuid", "p_session_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_update_complaint"("p_complaint_id" "uuid", "p_status" "text", "p_admin_response" "text" DEFAULT NULL::"text", "p_assigned_to" "uuid" DEFAULT NULL::"uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    IF p_status NOT IN (
        'open',
        'in_progress',
        'resolved',
        'closed'
    ) THEN
        RAISE EXCEPTION 'Invalid complaint status';
    END IF;

    UPDATE public.complaints
    SET
        status = p_status,
        admin_response = COALESCE(p_admin_response, admin_response),
        assigned_to = COALESCE(p_assigned_to, assigned_to),
        resolved_at = CASE
            WHEN p_status IN ('resolved', 'closed')
                THEN COALESCE(resolved_at, NOW())
            ELSE NULL
        END
    WHERE id = p_complaint_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Complaint not found';
    END IF;

    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."admin_update_complaint"("p_complaint_id" "uuid", "p_status" "text", "p_admin_response" "text", "p_assigned_to" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_waive_student_payment"("p_student_payment_id" "uuid", "p_reason" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN

    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    IF p_reason IS NULL OR LENGTH(TRIM(p_reason)) = 0 THEN
        RAISE EXCEPTION
            'Waiver reason is required';
    END IF;

    UPDATE public.student_payments
    SET
        status = 'waived',
        waived_reason = TRIM(p_reason),
        waived_at = NOW(),
        waived_by = auth.uid()
    WHERE id = p_student_payment_id
      AND status IN (
          'unpaid',
          'overdue',
          'partially_paid'
      );

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'Payment not found or cannot be waived';
    END IF;

    RETURN TRUE;

END;
$$;


ALTER FUNCTION "public"."admin_waive_student_payment"("p_student_payment_id" "uuid", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."begin_exam_attempt"("p_exam_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_user_id uuid;
    v_exam record;
    v_session record;
    v_attempt_id uuid;
    v_total_points numeric;
    v_questions jsonb;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    SELECT
        e.id,
        e.session_id,
        e.title,
        e.duration_minutes,
        e.passing_score,
        e.is_published
    INTO v_exam
    FROM public.exams e
    WHERE e.id = p_exam_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Exam not found';
    END IF;

    IF v_exam.is_published IS NOT TRUE THEN
        RAISE EXCEPTION 'Exam is not published';
    END IF;

    SELECT
        s.id,
        s.group_id,
        s.session_number
    INTO v_session
    FROM public.sessions s
    WHERE s.id = v_exam.session_id;

    IF NOT FOUND OR v_session.session_number IS NULL THEN
        RAISE EXCEPTION 'Invalid exam session';
    END IF;

    IF NOT public.is_group_student(v_session.group_id) THEN
        RAISE EXCEPTION 'You are not enrolled in this group';
    END IF;

    -- Every previous session must have a passed exam
    IF EXISTS (
        SELECT 1
        FROM public.sessions previous_session
        WHERE previous_session.group_id = v_session.group_id
          AND previous_session.session_number < v_session.session_number
          AND NOT EXISTS (
              SELECT 1
              FROM public.exams previous_exam
              JOIN public.exam_attempts previous_attempt
                ON previous_attempt.exam_id = previous_exam.id
              WHERE previous_exam.session_id = previous_session.id
                AND previous_attempt.student_id = v_user_id
                AND previous_attempt.passed IS TRUE
          )
    ) THEN
        RAISE EXCEPTION
            'You must pass all previous session exams first';
    END IF;

    SELECT COALESCE(SUM(q.points), 0)
    INTO v_total_points
    FROM public.questions q
    WHERE q.exam_id = p_exam_id;

    IF v_total_points <= 0 THEN
        RAISE EXCEPTION 'Exam has no valid questions or points';
    END IF;

    -- Questions are returned without correct_answer
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', q.id,
                'question_text', q.question_text,
                'question_type', q.question_type,
                'options', q.options,
                'points', q.points
            )
            ORDER BY q.created_at, q.id
        ),
        '[]'::jsonb
    )
    INTO v_questions
    FROM public.questions q
    WHERE q.exam_id = p_exam_id;

    INSERT INTO public.exam_attempts (
        exam_id,
        student_id,
        started_at,
        submitted_at,
        score,
        total_score,
        passed
    )
    VALUES (
        p_exam_id,
        v_user_id,
        now(),
        NULL,
        0,
        v_total_points,
        false
    )
    RETURNING id INTO v_attempt_id;

    RETURN jsonb_build_object(
        'attempt_id', v_attempt_id,
        'exam_id', p_exam_id,
        'title', v_exam.title,
        'duration_minutes', v_exam.duration_minutes,
        'passing_score', COALESCE(v_exam.passing_score, 70),
        'total_score', v_total_points,
        'questions', v_questions
    );
END;
$$;


ALTER FUNCTION "public"."begin_exam_attempt"("p_exam_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."claim_next_rag_job"() RETURNS TABLE("job_id" "uuid", "material_id" "uuid", "bucket_id" "text", "object_path" "text", "attempt_number" integer)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
    WITH next_job AS (
        SELECT j.id
        FROM public.rag_ingestion_jobs j
        WHERE j.attempts < 5
          AND (
              j.status = 'pending'
              OR (
                  j.status = 'processing'
                  AND j.locked_at < NOW() - INTERVAL '15 minutes'
              )
          )
        ORDER BY j.created_at
        FOR UPDATE SKIP LOCKED
        LIMIT 1
    )
    UPDATE public.rag_ingestion_jobs j
    SET
        status = 'processing',
        attempts = j.attempts + 1,
        locked_at = NOW(),
        updated_at = NOW()
    FROM next_job
    WHERE j.id = next_job.id
    RETURNING
        j.id,
        j.material_id,
        j.bucket_id,
        j.source_file_url,
        j.attempts;
$$;


ALTER FUNCTION "public"."claim_next_rag_job"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_rag_job"("p_job_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
    v_material_id UUID;
    v_total_chunks INTEGER;
    v_embedded_chunks INTEGER;
BEGIN
    SELECT material_id
    INTO v_material_id
    FROM public.rag_ingestion_jobs
    WHERE id = p_job_id
      AND status = 'processing'
    FOR UPDATE;

    IF v_material_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'reason', 'job_not_found_or_not_processing'
        );
    END IF;

    SELECT
        COUNT(*)::INTEGER,
        COUNT(*) FILTER (
            WHERE embedding IS NOT NULL
        )::INTEGER
    INTO v_total_chunks, v_embedded_chunks
    FROM public.course_material_chunks
    WHERE material_id = v_material_id;

    IF v_total_chunks = 0
       OR v_total_chunks <> v_embedded_chunks THEN
        RETURN jsonb_build_object(
            'success', false,
            'reason', 'chunks_missing_or_embeddings_incomplete',
            'total_chunks', v_total_chunks,
            'embedded_chunks', v_embedded_chunks
        );
    END IF;

    UPDATE public.rag_ingestion_jobs
    SET
        status = 'completed',
        processed_at = NOW(),
        locked_at = NULL,
        last_error = NULL,
        updated_at = NOW()
    WHERE id = p_job_id;

    UPDATE public.course_materials
    SET
        rag_status = 'completed',
        rag_error = NULL,
        rag_processed_at = NOW(),
        rag_chunk_count = v_total_chunks
    WHERE id = v_material_id;

    RETURN jsonb_build_object(
        'success', true,
        'material_id', v_material_id,
        'total_chunks', v_total_chunks,
        'embedded_chunks', v_embedded_chunks
    );
END;
$$;


ALTER FUNCTION "public"."complete_rag_job"("p_job_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_ai_chat_conversation"("p_title" "text" DEFAULT 'New conversation'::"text", "p_group_id" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_conversation_id UUID;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF p_group_id IS NOT NULL
       AND NOT (
           public.is_admin()
           OR public.is_group_teacher(p_group_id)
           OR public.is_group_student(p_group_id)
       )
    THEN
        RAISE EXCEPTION 'You do not have access to this group';
    END IF;

    INSERT INTO public.ai_conversations (
        user_id,
        group_id,
        title
    )
    VALUES (
        auth.uid(),
        p_group_id,
        COALESCE(NULLIF(TRIM(p_title), ''), 'New conversation')
    )
    RETURNING id INTO v_conversation_id;

    RETURN v_conversation_id;
END;
$$;


ALTER FUNCTION "public"."create_ai_chat_conversation"("p_title" "text", "p_group_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_role"() RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
    SELECT role
    FROM public.profiles
    WHERE id = (SELECT auth.uid())
    LIMIT 1;
$$;


ALTER FUNCTION "public"."current_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."end_session_video"("p_play_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_user_id UUID;
    v_ended_at TIMESTAMPTZ;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    UPDATE public.video_plays
    SET ended_at = NOW()
    WHERE id = p_play_id
      AND student_id = v_user_id
      AND ended_at IS NULL
    RETURNING ended_at INTO v_ended_at;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Active video play not found';
    END IF;

    RETURN jsonb_build_object(
        'success', TRUE,
        'play_id', p_play_id,
        'ended_at', v_ended_at
    );
END;
$$;


ALTER FUNCTION "public"."end_session_video"("p_play_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enqueue_rag_material"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    IF NEW.file_url IS NULL OR BTRIM(NEW.file_url) = '' THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT'
       OR NEW.file_url IS DISTINCT FROM OLD.file_url THEN

        INSERT INTO public.rag_ingestion_jobs (
            material_id,
            bucket_id,
            source_file_url,
            status,
            attempts,
            last_error,
            locked_at,
            processed_at,
            updated_at
        )
        VALUES (
            NEW.id,
            'course-materials',
            NEW.file_url,
            'pending',
            0,
            NULL,
            NULL,
            NULL,
            NOW()
        )
        ON CONFLICT (material_id)
        DO UPDATE SET
            bucket_id = EXCLUDED.bucket_id,
            source_file_url = EXCLUDED.source_file_url,
            status = 'pending',
            attempts = 0,
            last_error = NULL,
            locked_at = NULL,
            processed_at = NULL,
            updated_at = NOW();

    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."enqueue_rag_material"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fail_rag_job"("p_job_id" "uuid", "p_error" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
    v_material_id UUID;
    v_attempts INTEGER;
    v_new_status TEXT;
BEGIN
    SELECT material_id, attempts
    INTO v_material_id, v_attempts
    FROM public.rag_ingestion_jobs
    WHERE id = p_job_id
      AND status = 'processing'
    FOR UPDATE;

    IF v_material_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'reason', 'job_not_found_or_not_processing'
        );
    END IF;

    v_new_status := CASE
        WHEN v_attempts >= 5 THEN 'failed'
        ELSE 'pending'
    END;

    UPDATE public.rag_ingestion_jobs
    SET
        status = v_new_status,
        last_error = LEFT(
            COALESCE(p_error, 'Unknown processing error'),
            4000
        ),
        locked_at = NULL,
        updated_at = NOW()
    WHERE id = p_job_id;

    UPDATE public.course_materials
    SET
        rag_status = v_new_status,
        rag_error = LEFT(
            COALESCE(p_error, 'Unknown processing error'),
            4000
        )
    WHERE id = v_material_id;

    RETURN jsonb_build_object(
        'success', true,
        'job_status', v_new_status,
        'attempts', v_attempts,
        'will_retry', v_new_status = 'pending'
    );
END;
$$;


ALTER FUNCTION "public"."fail_rag_job"("p_job_id" "uuid", "p_error" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."finish_video_play"("p_playback_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    v_updated INTEGER;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    UPDATE public.video_plays
    SET ended_at = COALESCE(
        ended_at,
        timezone('UTC', NOW())
    )
    WHERE id = p_playback_id
      AND student_id = auth.uid();

    GET DIAGNOSTICS v_updated = ROW_COUNT;

    IF v_updated = 0 THEN
        RAISE EXCEPTION 'Playback not found';
    END IF;

    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."finish_video_play"("p_playback_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_admin_dashboard"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_user UUID := auth.uid();
    v_result JSONB;
BEGIN
    IF v_user IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    SELECT jsonb_build_object(
        'users', (
            SELECT jsonb_build_object(
                'total', COUNT(*),
                'students', COUNT(*) FILTER (WHERE role = 'student'),
                'teachers', COUNT(*) FILTER (WHERE role = 'teacher'),
                'parents', COUNT(*) FILTER (WHERE role = 'parent'),
                'admins', COUNT(*) FILTER (WHERE role = 'admin')
            )
            FROM public.profiles
        ),

        'courses', (
            SELECT jsonb_build_object(
                'total', COUNT(*),
                'published', COUNT(*) FILTER (WHERE status = 'published'),
                'draft', COUNT(*) FILTER (WHERE status = 'draft')
            )
            FROM public.courses
        ),

        'groups', (
            SELECT jsonb_build_object(
                'total', COUNT(*),
                'active', COUNT(*) FILTER (WHERE status = 'active'),
                'completed', COUNT(*) FILTER (WHERE status = 'completed')
            )
            FROM public.course_groups
        ),

        'learning', (
            SELECT jsonb_build_object(
                'sessions', (
                    SELECT COUNT(*)
                    FROM public.sessions
                    WHERE is_published = TRUE
                ),
                'exams', (
                    SELECT COUNT(*)
                    FROM public.exams
                    WHERE is_published = TRUE
                ),
                'assignments', (
                    SELECT COUNT(*)
                    FROM public.assignments
                    WHERE is_published = TRUE
                )
            )
        ),

        'complaints', (
            SELECT jsonb_build_object(
                'total', COUNT(*),
                'open', COUNT(*) FILTER (WHERE status = 'open'),
                'in_progress', COUNT(*) FILTER (
                    WHERE status = 'in_progress'
                ),
                'resolved', COUNT(*) FILTER (WHERE status = 'resolved')
            )
            FROM public.complaints
        ),

        'payments', (
            SELECT jsonb_build_object(
                'total_records', COUNT(*),
                'paid_records', COUNT(*) FILTER (WHERE status = 'paid'),
                'unpaid_records', COUNT(*) FILTER (WHERE status = 'unpaid'),
                'overdue_records', COUNT(*) FILTER (WHERE status = 'overdue'),
                'total_amount', COALESCE(SUM(amount), 0)
            )
            FROM public.student_payments
        ),

        'notifications', (
            SELECT COUNT(*)
            FROM public.notifications
        )
    )
    INTO v_result;

    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_admin_dashboard"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_exam_questions"("p_exam_id" "uuid") RETURNS TABLE("question_id" "uuid", "question_text" "text", "question_type" "text", "options" "jsonb", "points" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    v_student_id UUID;
    v_session_id UUID;
    v_group_id UUID;
    v_session_number INTEGER;
    v_previous_session_id UUID;
BEGIN
    v_student_id := auth.uid();

    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = v_student_id
          AND p.role = 'student'
    ) THEN
        RAISE EXCEPTION 'Only students can access exam questions';
    END IF;

    SELECT s.id, s.group_id, s.session_number
    INTO v_session_id, v_group_id, v_session_number
    FROM public.exams e
    JOIN public.sessions s ON s.id = e.session_id
    WHERE e.id = p_exam_id
      AND e.is_published = TRUE
      AND s.is_published = TRUE;

    IF v_session_id IS NULL THEN
        RAISE EXCEPTION 'Exam not found or not published';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.enrollments en
        WHERE en.student_id = v_student_id
          AND en.group_id = v_group_id
          AND en.status = 'active'
    ) THEN
        RAISE EXCEPTION 'You are not enrolled in this group';
    END IF;

    SELECT s.id
    INTO v_previous_session_id
    FROM public.sessions s
    WHERE s.group_id = v_group_id
      AND s.session_number < v_session_number
      AND s.is_published = TRUE
    ORDER BY s.session_number DESC
    LIMIT 1;

    IF v_previous_session_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1
            FROM public.exams e
            JOIN public.exam_attempts a ON a.exam_id = e.id
            WHERE e.session_id = v_previous_session_id
              AND e.is_published = TRUE
              AND a.student_id = v_student_id
              AND a.passed = TRUE
        ) THEN
            RAISE EXCEPTION 'You must pass the previous session exam first';
        END IF;
    END IF;

    RETURN QUERY
    SELECT
        q.id,
        q.question_text,
        q.question_type,
        q.options,
        q.points
    FROM public.questions q
    WHERE q.exam_id = p_exam_id;
END;
$$;


ALTER FUNCTION "public"."get_exam_questions"("p_exam_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_parent_dashboard"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_user UUID := auth.uid();
    v_result JSONB;
BEGIN
    IF v_user IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = v_user
          AND role IN ('parent', 'admin')
    ) THEN
        RAISE EXCEPTION 'Parent access required';
    END IF;

    SELECT jsonb_build_object(
        'children', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'student_id', p.id,
                    'student_name', p.full_name,
                    'groups', (
                        SELECT COUNT(*)
                        FROM public.enrollments e
                        WHERE e.student_id = p.id
                          AND e.status = 'active'
                    ),
                    'attendance', (
                        SELECT jsonb_build_object(
                            'present', COUNT(*) FILTER (
                                WHERE a.status = 'present'
                            ),
                            'absent', COUNT(*) FILTER (
                                WHERE a.status = 'absent'
                            ),
                            'late', COUNT(*) FILTER (
                                WHERE a.status = 'late'
                            )
                        )
                        FROM public.attendance a
                        WHERE a.student_id = p.id
                    ),
                    'average_exam_score', (
                        SELECT ROUND(
                            AVG(100.0 * ea.score /
                                NULLIF(ea.total_score, 0)), 2
                        )
                        FROM public.exam_attempts ea
                        WHERE ea.student_id = p.id
                          AND ea.submitted_at IS NOT NULL
                          AND ea.total_score > 0
                    ),
                    'pending_payments', (
                        SELECT COUNT(*)
                        FROM public.student_payments sp
                        WHERE sp.student_id = p.id
                          AND sp.status IN ('unpaid', 'partially_paid', 'overdue')
                    )
                )
            )
            FROM public.parent_student_links l
            JOIN public.profiles p ON p.id = l.student_id
            WHERE l.parent_id = v_user
              AND l.status = 'approved'
        ), '[]'::JSONB),

        'unread_notifications', (
            SELECT COUNT(*)
            FROM public.notifications
            WHERE user_id = v_user
              AND is_read = FALSE
        )
    )
    INTO v_result;

    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_parent_dashboard"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_published_exam_questions"("p_exam_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_group_id UUID;
    v_result JSONB;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    SELECT s.group_id
    INTO v_group_id
    FROM public.exams e
    JOIN public.sessions s ON s.id = e.session_id
    WHERE e.id = p_exam_id
      AND e.is_published = TRUE
      AND s.is_published = TRUE;

    IF v_group_id IS NULL THEN
        RAISE EXCEPTION 'Published exam not found';
    END IF;

    IF NOT (
        public.is_admin()
        OR public.is_group_teacher(v_group_id)
        OR public.is_group_student(v_group_id)
    ) THEN
        RAISE EXCEPTION 'You do not have access to this exam';
    END IF;

    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', q.id,
                'question_text', q.question_text,
                'question_type', q.question_type,
                'options', q.options,
                'points', q.points
            )
            ORDER BY q.id
        ),
        '[]'::JSONB
    )
    INTO v_result
    FROM public.questions q
    WHERE q.exam_id = p_exam_id;

    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_published_exam_questions"("p_exam_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_student_dashboard"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_user UUID := auth.uid();
    v_result JSONB;
BEGIN
    IF v_user IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    SELECT jsonb_build_object(
        'student_id', v_user,

        'active_groups', (
            SELECT COUNT(*)
            FROM public.enrollments
            WHERE student_id = v_user
              AND status = 'active'
        ),

        'attendance', (
            SELECT jsonb_build_object(
                'total', COUNT(*),
                'present', COUNT(*) FILTER (WHERE status = 'present'),
                'absent', COUNT(*) FILTER (WHERE status = 'absent'),
                'late', COUNT(*) FILTER (WHERE status = 'late'),
                'excused', COUNT(*) FILTER (WHERE status = 'excused')
            )
            FROM public.attendance
            WHERE student_id = v_user
        ),

        'exam_attempts', (
            SELECT COUNT(*)
            FROM public.exam_attempts
            WHERE student_id = v_user
              AND submitted_at IS NOT NULL
        ),

        'average_exam_score', (
            SELECT ROUND(
                AVG(100.0 * score / NULLIF(total_score, 0)), 2
            )
            FROM public.exam_attempts
            WHERE student_id = v_user
              AND submitted_at IS NOT NULL
              AND total_score > 0
        ),

        'pending_assignments', (
            SELECT COUNT(*)
            FROM public.assignments a
            JOIN public.enrollments e ON e.group_id = a.group_id
            WHERE e.student_id = v_user
              AND e.status = 'active'
              AND a.is_published = TRUE
              AND NOT EXISTS (
                  SELECT 1
                  FROM public.assignment_submissions ass
                  WHERE ass.assignment_id = a.id
                    AND ass.student_id = v_user
              )
        ),

        'unread_notifications', (
            SELECT COUNT(*)
            FROM public.notifications
            WHERE user_id = v_user
              AND is_read = FALSE
        ),

        'groups', (
            SELECT COALESCE(jsonb_agg(
                jsonb_build_object(
                    'group_id', g.id,
                    'group_name', g.name,
                    'course_id', g.course_id,
                    'course_title', c.title,
                    'teacher_id', g.teacher_id,
                    'status', e.status
                )
            ), '[]'::JSONB)
            FROM public.enrollments e
            JOIN public.course_groups g ON g.id = e.group_id
            JOIN public.courses c ON c.id = g.course_id
            WHERE e.student_id = v_user
              AND e.status = 'active'
        )
    )
    INTO v_result;

    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_student_dashboard"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_student_group_analytics"("p_student_id" "uuid", "p_group_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_result JSONB;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF NOT (
        auth.uid() = p_student_id
        OR public.is_admin()
        OR public.is_group_teacher(p_group_id)
        OR public.is_parent_of_student(p_student_id)
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.enrollments
        WHERE student_id = p_student_id
          AND group_id = p_group_id
    ) THEN
        RAISE EXCEPTION 'Student is not enrolled in this group';
    END IF;

    SELECT to_jsonb(v)
    INTO v_result
    FROM public.v_student_group_analytics v
    WHERE v.student_id = p_student_id
      AND v.group_id = p_group_id;

    RETURN COALESCE(v_result, '{}'::JSONB);
END;
$$;


ALTER FUNCTION "public"."get_student_group_analytics"("p_student_id" "uuid", "p_group_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_teacher_dashboard"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_user UUID := auth.uid();
    v_result JSONB;
BEGIN
    IF v_user IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = v_user
          AND role IN ('teacher', 'admin')
    ) THEN
        RAISE EXCEPTION 'Teacher access required';
    END IF;

    SELECT jsonb_build_object(
        'groups_count', (
            SELECT COUNT(*)
            FROM public.course_groups
            WHERE teacher_id = v_user
        ),

        'active_groups', (
            SELECT COUNT(*)
            FROM public.course_groups
            WHERE teacher_id = v_user
              AND status = 'active'
        ),

        'active_students', (
            SELECT COUNT(DISTINCT e.student_id)
            FROM public.enrollments e
            JOIN public.course_groups g ON g.id = e.group_id
            WHERE g.teacher_id = v_user
              AND e.status = 'active'
        ),

        'published_sessions', (
            SELECT COUNT(*)
            FROM public.sessions s
            JOIN public.course_groups g ON g.id = s.group_id
            WHERE g.teacher_id = v_user
              AND s.is_published = TRUE
        ),

        'pending_submissions', (
            SELECT COUNT(*)
            FROM public.assignment_submissions ass
            JOIN public.assignments a ON a.id = ass.assignment_id
            JOIN public.course_groups g ON g.id = a.group_id
            WHERE g.teacher_id = v_user
              AND ass.status = 'submitted'
        ),

        'groups', (
            SELECT COALESCE(jsonb_agg(
                jsonb_build_object(
                    'group_id', g.id,
                    'group_name', g.name,
                    'course_id', g.course_id,
                    'course_title', c.title,
                    'status', g.status,
                    'active_students', (
                        SELECT COUNT(*)
                        FROM public.enrollments e
                        WHERE e.group_id = g.id
                          AND e.status = 'active'
                    )
                )
            ), '[]'::JSONB)
            FROM public.course_groups g
            LEFT JOIN public.courses c ON c.id = g.course_id
            WHERE g.teacher_id = v_user
        )
    )
    INTO v_result;

    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_teacher_dashboard"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_unread_notifications_count"() RETURNS bigint
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    SELECT COUNT(*)
    FROM public.notifications
    WHERE user_id = auth.uid()
      AND is_read = false;
$$;


ALTER FUNCTION "public"."get_unread_notifications_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        full_name,
        email,
        role
    )
    VALUES (
        NEW.id,
        COALESCE(
            NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''),
            'New User'
        ),
        NEW.email,
        'student'
    );

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = (SELECT auth.uid())
        AND role = 'admin'
    );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_group_student"("p_group_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.enrollments
        WHERE group_id = p_group_id
        AND student_id = (SELECT auth.uid())
        AND status = 'active'
    );
$$;


ALTER FUNCTION "public"."is_group_student"("p_group_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_group_teacher"("p_group_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.course_groups
        WHERE id = p_group_id
        AND teacher_id = (SELECT auth.uid())
    );
$$;


ALTER FUNCTION "public"."is_group_teacher"("p_group_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_parent_of_student"("p_student_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.parent_student_links
        WHERE parent_id = (SELECT auth.uid())
        AND student_id = p_student_id
        AND status = 'approved'
    );
$$;


ALTER FUNCTION "public"."is_parent_of_student"("p_student_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_all_notifications_read"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_count integer;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    UPDATE public.notifications
    SET is_read = true
    WHERE user_id = auth.uid()
      AND is_read = false;

    GET DIAGNOSTICS v_count = ROW_COUNT;

    RETURN jsonb_build_object(
        'success', true,
        'updated_count', v_count
    );
END;
$$;


ALTER FUNCTION "public"."mark_all_notifications_read"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_notification_read"("p_notification_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_id uuid;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    UPDATE public.notifications
    SET is_read = true
    WHERE id = p_notification_id
      AND (
          user_id = auth.uid()
          OR public.is_admin()
      )
    RETURNING id INTO v_id;

    IF v_id IS NULL THEN
        RAISE EXCEPTION 'Notification not found or access denied';
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'notification_id', v_id
    );
END;
$$;


ALTER FUNCTION "public"."mark_notification_read"("p_notification_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_course_material_chunks"("query_embedding" "extensions"."vector", "match_count" integer DEFAULT 8, "filter_material_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("chunk_id" "uuid", "material_id" "uuid", "material_title" "text", "chunk_index" integer, "content" "text", "similarity" double precision)
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public', 'extensions'
    AS $$
    SELECT
        c.id,
        c.material_id,
        cm.title,
        c.chunk_index,
        c.content,
        (
            1 - (c.embedding <=> query_embedding)
        )::DOUBLE PRECISION AS similarity

    FROM public.course_material_chunks c

    JOIN public.course_materials cm
        ON cm.id = c.material_id

    WHERE
        c.embedding IS NOT NULL

        AND (
            filter_material_id IS NULL
            OR c.material_id = filter_material_id
        )

    ORDER BY
        c.embedding <=> query_embedding

    LIMIT LEAST(
        GREATEST(COALESCE(match_count, 8), 1),
        20
    );
$$;


ALTER FUNCTION "public"."match_course_material_chunks"("query_embedding" "extensions"."vector", "match_count" integer, "filter_material_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_assignment_submission"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_teacher_id uuid;
    v_student_name text;
    v_assignment_title text;
BEGIN
    SELECT
        cg.teacher_id,
        p.full_name,
        a.title
    INTO
        v_teacher_id,
        v_student_name,
        v_assignment_title
    FROM public.assignments a
    JOIN public.course_groups cg
        ON cg.id = a.group_id
    JOIN public.profiles p
        ON p.id = NEW.student_id
    WHERE a.id = NEW.assignment_id;

    IF v_teacher_id IS NOT NULL THEN
        INSERT INTO public.notifications (
            user_id,
            title,
            message,
            notification_type,
            related_url
        )
        VALUES (
            v_teacher_id,
            'New Assignment Submission',
            v_student_name || ' submitted: ' || v_assignment_title,
            'assignment',
            '/assignments/' || NEW.assignment_id::text
        );
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_assignment_submission"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_complaint_update"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status
       OR NEW.admin_response IS DISTINCT FROM OLD.admin_response THEN

        INSERT INTO public.notifications (
            user_id,
            title,
            message,
            notification_type,
            related_url
        )
        VALUES (
            NEW.submitted_by,
            'Complaint Updated',
            'Your complaint "' || NEW.subject
                || '" status is now: ' || NEW.status,
            'complaint',
            '/complaints/' || NEW.id::text
        );
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_complaint_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_payment_transaction"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_student_id uuid;
    v_currency text;
BEGIN
    SELECT student_id, currency
    INTO v_student_id, v_currency
    FROM public.student_payments
    WHERE id = NEW.student_payment_id;

    IF v_student_id IS NOT NULL THEN
        INSERT INTO public.notifications (
            user_id,
            title,
            message,
            notification_type,
            related_url
        )
        VALUES (
            v_student_id,
            'Payment Recorded',
            'A payment of ' || NEW.amount::text || ' '
                || COALESCE(v_currency, 'EGP')
                || ' has been recorded.',
            'payment',
            '/payments'
        );
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_payment_transaction"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_published_session"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF NEW.is_published IS TRUE
       AND OLD.is_published IS DISTINCT FROM TRUE THEN

        INSERT INTO public.notifications (
            user_id,
            title,
            message,
            notification_type,
            related_url
        )
        SELECT
            recipients.user_id,
            'New Session Available',
            'A new session has been published: ' || NEW.title,
            'session',
            '/sessions/' || NEW.id::text
        FROM (
            SELECT DISTINCT e.student_id AS user_id
            FROM public.enrollments e
            JOIN public.course_groups cg
                ON cg.id = e.group_id
            WHERE cg.id = NEW.group_id
              AND e.status = 'active'

            UNION

            SELECT DISTINCT psl.parent_id AS user_id
            FROM public.parent_student_links psl
            JOIN public.enrollments e
                ON e.student_id = psl.student_id
            WHERE e.group_id = NEW.group_id
              AND e.status = 'active'
              AND psl.status = 'approved'
        ) recipients;

    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_published_session"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_student_payment"("p_student_payment_id" "uuid", "p_amount" numeric, "p_payment_method" "text", "p_notes" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    v_total NUMERIC(12,2);
    v_paid NUMERIC(12,2);
    v_remaining NUMERIC(12,2);
    v_status TEXT;
    v_transaction_id UUID;
BEGIN

    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    IF p_amount IS NULL OR p_amount <= 0 THEN
        RAISE EXCEPTION
            'Payment amount must be greater than zero';
    END IF;

    IF p_payment_method IS NULL OR p_payment_method NOT IN (
        'cash',
        'instapay',
        'vodafone_cash',
        'bank_transfer',
        'other'
    ) THEN
        RAISE EXCEPTION 'Invalid payment method';
    END IF;

    SELECT amount, status
    INTO v_total, v_status
    FROM public.student_payments
    WHERE id = p_student_payment_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'Student payment record not found';
    END IF;

    IF v_status = 'waived' THEN
        RAISE EXCEPTION
            'Cannot pay a waived payment';
    END IF;

    IF v_status = 'paid' THEN
        RAISE EXCEPTION
            'This payment is already fully paid';
    END IF;

    SELECT COALESCE(SUM(amount), 0)
    INTO v_paid
    FROM public.payment_transactions
    WHERE student_payment_id = p_student_payment_id;

    v_remaining := v_total - v_paid;

    IF v_remaining <= 0 THEN
        RAISE EXCEPTION
            'No remaining balance for this payment';
    END IF;

    IF p_amount > v_remaining THEN
        RAISE EXCEPTION
            'Payment exceeds remaining balance: %',
            v_remaining;
    END IF;

    INSERT INTO public.payment_transactions (
        student_payment_id,
        amount,
        payment_method,
        recorded_by,
        notes
    )
    VALUES (
        p_student_payment_id,
        p_amount,
        p_payment_method,
        auth.uid(),
        p_notes
    )
    RETURNING id INTO v_transaction_id;

    v_paid := v_paid + p_amount;
    v_remaining := v_total - v_paid;

    UPDATE public.student_payments
    SET
        status = CASE
            WHEN v_remaining = 0 THEN 'paid'
            ELSE 'partially_paid'
        END,
        paid_at = CASE
            WHEN v_remaining = 0 THEN NOW()
            ELSE NULL
        END,
        payment_method = p_payment_method,
        recorded_by = auth.uid()
    WHERE id = p_student_payment_id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'transaction_id', v_transaction_id,
        'total_amount', v_total,
        'paid_amount', v_paid,
        'remaining_amount', v_remaining,
        'status', CASE
            WHEN v_remaining = 0 THEN 'paid'
            ELSE 'partially_paid'
        END
    );

END;
$$;


ALTER FUNCTION "public"."record_student_payment"("p_student_payment_id" "uuid", "p_amount" numeric, "p_payment_method" "text", "p_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."save_ai_assistant_reply"("p_conversation_id" "uuid", "p_message" "text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_message_id UUID;
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION 'Trusted backend authorization required';
    END IF;

    IF p_message IS NULL OR LENGTH(TRIM(p_message)) = 0 THEN
        RAISE EXCEPTION 'Reply cannot be empty';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.ai_conversations
        WHERE id = p_conversation_id
    ) THEN
        RAISE EXCEPTION 'Conversation not found';
    END IF;

    INSERT INTO public.ai_messages (
        conversation_id,
        sender,
        message,
        metadata
    )
    VALUES (
        p_conversation_id,
        'assistant',
        p_message,
        COALESCE(p_metadata, '{}'::JSONB)
    )
    RETURNING id INTO v_message_id;

    UPDATE public.ai_conversations
    SET updated_at = NOW()
    WHERE id = p_conversation_id;

    RETURN v_message_id;
END;
$$;


ALTER FUNCTION "public"."save_ai_assistant_reply"("p_conversation_id" "uuid", "p_message" "text", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."save_ai_generated_questions"("p_exam_id" "uuid", "p_questions" "jsonb") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_group_id UUID;
    v_question JSONB;
    v_count INTEGER := 0;
    v_type TEXT;
    v_text TEXT;
    v_answer TEXT;
    v_options JSONB;
    v_points NUMERIC;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    SELECT s.group_id
    INTO v_group_id
    FROM public.exams e
    JOIN public.sessions s ON s.id = e.session_id
    WHERE e.id = p_exam_id;

    IF v_group_id IS NULL THEN
        RAISE EXCEPTION 'Exam not found';
    END IF;

    IF NOT (
        public.is_admin()
        OR public.is_group_teacher(v_group_id)
    ) THEN
        RAISE EXCEPTION 'You are not authorized to edit this exam';
    END IF;

    IF jsonb_typeof(p_questions) <> 'array' THEN
        RAISE EXCEPTION 'Questions must be a JSON array';
    END IF;

    IF jsonb_array_length(p_questions) < 1
       OR jsonb_array_length(p_questions) > 100 THEN
        RAISE EXCEPTION 'Provide between 1 and 100 questions';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.exams
        WHERE id = p_exam_id
          AND is_published = TRUE
    ) THEN
        RAISE EXCEPTION 'Cannot add questions to a published exam';
    END IF;

    FOR v_question IN
        SELECT value FROM jsonb_array_elements(p_questions)
    LOOP
        v_text := NULLIF(TRIM(v_question->>'question_text'), '');
        v_type := v_question->>'question_type';
        v_answer := NULLIF(TRIM(v_question->>'correct_answer'), '');
        v_options := v_question->'options';

        IF v_text IS NULL OR v_answer IS NULL THEN
            RAISE EXCEPTION 'Question text and correct answer are required';
        END IF;

        IF v_type NOT IN ('mcq', 'true_false') THEN
            RAISE EXCEPTION 'Invalid question type: %', v_type;
        END IF;

        IF v_type = 'mcq' THEN
            IF jsonb_typeof(v_options) <> 'array'
               OR jsonb_array_length(v_options) < 2 THEN
                RAISE EXCEPTION 'MCQ questions require at least two options';
            END IF;

            IF NOT EXISTS (
                SELECT 1
                FROM jsonb_array_elements(v_options) AS opt(value)
                WHERE opt.value = to_jsonb(v_answer)
            ) THEN
                RAISE EXCEPTION 'Correct answer must match one of the options';
            END IF;
        ELSE
            IF LOWER(v_answer) NOT IN ('true', 'false') THEN
                RAISE EXCEPTION 'True/false answer must be true or false';
            END IF;
        END IF;

        v_points := COALESCE(
            NULLIF(v_question->>'points', '')::NUMERIC,
            1
        );

        IF v_points <= 0 THEN
            RAISE EXCEPTION 'Question points must be greater than zero';
        END IF;

        INSERT INTO public.questions (
            exam_id,
            question_text,
            question_type,
            options,
            correct_answer,
            points
        )
        VALUES (
            p_exam_id,
            v_text,
            v_type,
            CASE
                WHEN v_type = 'mcq' THEN v_options
                ELSE COALESCE(v_options, '[]'::JSONB)
            END,
            v_answer,
            v_points
        );

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$;


ALTER FUNCTION "public"."save_ai_generated_questions"("p_exam_id" "uuid", "p_questions" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."send_lms_notification"("p_user_id" "uuid", "p_title" "text", "p_message" "text", "p_notification_type" "text" DEFAULT 'general'::"text", "p_related_url" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_sender uuid;
    v_is_admin boolean;
    v_is_teacher boolean;
    v_target_role text;
    v_notification_id uuid;
BEGIN
    v_sender := auth.uid();

    IF v_sender IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF p_user_id IS NULL
       OR NULLIF(trim(p_title), '') IS NULL
       OR NULLIF(trim(p_message), '') IS NULL THEN
        RAISE EXCEPTION 'Invalid notification data';
    END IF;

    SELECT public.is_admin()
    INTO v_is_admin;

    SELECT role
    INTO v_target_role
    FROM public.profiles
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Target user not found';
    END IF;

    IF NOT v_is_admin THEN

        SELECT EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = v_sender
              AND role = 'teacher'
        )
        INTO v_is_teacher;

        IF NOT v_is_teacher THEN
            RAISE EXCEPTION 'Permission denied';
        END IF;

        IF v_target_role = 'student' THEN

            IF NOT EXISTS (
                SELECT 1
                FROM public.enrollments e
                JOIN public.course_groups cg
                    ON cg.id = e.group_id
                WHERE e.student_id = p_user_id
                  AND e.status = 'active'
                  AND cg.teacher_id = v_sender
            ) THEN
                RAISE EXCEPTION 'Student is not in your groups';
            END IF;

        ELSIF v_target_role = 'parent' THEN

            IF NOT EXISTS (
                SELECT 1
                FROM public.parent_student_links psl
                JOIN public.enrollments e
                    ON e.student_id = psl.student_id
                JOIN public.course_groups cg
                    ON cg.id = e.group_id
                WHERE psl.parent_id = p_user_id
                  AND psl.status = 'approved'
                  AND e.status = 'active'
                  AND cg.teacher_id = v_sender
            ) THEN
                RAISE EXCEPTION 'Parent is not connected to your students';
            END IF;

        ELSE
            RAISE EXCEPTION 'Teacher cannot notify this user role';
        END IF;
    END IF;

    INSERT INTO public.notifications (
        user_id,
        title,
        message,
        notification_type,
        related_url
    )
    VALUES (
        p_user_id,
        trim(p_title),
        trim(p_message),
        COALESCE(p_notification_type, 'general'),
        p_related_url
    )
    RETURNING id INTO v_notification_id;

    RETURN jsonb_build_object(
        'success', true,
        'notification_id', v_notification_id
    );
END;
$$;


ALTER FUNCTION "public"."send_lms_notification"("p_user_id" "uuid", "p_title" "text", "p_message" "text", "p_notification_type" "text", "p_related_url" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."start_exam"("p_exam_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    v_student_id UUID;
    v_session_id UUID;
    v_group_id UUID;
    v_session_number INTEGER;
    v_previous_session_id UUID;
    v_attempt_id UUID;
BEGIN
    v_student_id := auth.uid();

    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = v_student_id
          AND role = 'student'
    ) THEN
        RAISE EXCEPTION 'Only students can start exams';
    END IF;

    SELECT s.id, s.group_id, s.session_number
    INTO v_session_id, v_group_id, v_session_number
    FROM public.exams e
    JOIN public.sessions s ON s.id = e.session_id
    WHERE e.id = p_exam_id
      AND e.is_published = TRUE
      AND s.is_published = TRUE;

    IF v_session_id IS NULL THEN
        RAISE EXCEPTION 'Exam not found or not published';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.enrollments
        WHERE student_id = v_student_id
          AND group_id = v_group_id
          AND status = 'active'
    ) THEN
        RAISE EXCEPTION 'You are not enrolled in this group';
    END IF;

    SELECT s.id
    INTO v_previous_session_id
    FROM public.sessions s
    JOIN public.exams e
      ON e.session_id = s.id
     AND e.is_published = TRUE
    WHERE s.group_id = v_group_id
      AND s.session_number < v_session_number
      AND s.is_published = TRUE
    ORDER BY s.session_number DESC
    LIMIT 1;

    IF v_previous_session_id IS NOT NULL
       AND NOT EXISTS (
           SELECT 1
           FROM public.exams e
           JOIN public.exam_attempts a ON a.exam_id = e.id
           WHERE e.session_id = v_previous_session_id
             AND a.student_id = v_student_id
             AND a.passed = TRUE
       )
    THEN
        RAISE EXCEPTION 'You must pass the previous session exam first';
    END IF;

    INSERT INTO public.exam_attempts (
        exam_id,
        student_id,
        started_at
    )
    VALUES (
        p_exam_id,
        v_student_id,
        NOW()
    )
    RETURNING id INTO v_attempt_id;

    RETURN v_attempt_id;
END;
$$;


ALTER FUNCTION "public"."start_exam"("p_exam_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."start_session_video"("p_session_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_user_id UUID;
    v_group_id UUID;
    v_video_url TEXT;
    v_published BOOLEAN;
    v_play_id UUID;
    v_play_number INTEGER;
    v_used_plays INTEGER;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Lock session row to avoid simultaneous play-limit bypass.
    SELECT group_id, video_url, is_published
    INTO v_group_id, v_video_url, v_published
    FROM public.sessions
    WHERE id = p_session_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Session not found';
    END IF;

    IF v_published IS NOT TRUE
       OR v_video_url IS NULL
       OR TRIM(v_video_url) = '' THEN
        RAISE EXCEPTION 'Video is not available';
    END IF;

    IF NOT public.is_group_student(v_group_id) THEN
        RAISE EXCEPTION 'Active enrollment required';
    END IF;

    -- Resume an existing active play without consuming another play.
    SELECT id, play_number
    INTO v_play_id, v_play_number
    FROM public.video_plays
    WHERE session_id = p_session_id
      AND student_id = v_user_id
      AND ended_at IS NULL
    ORDER BY started_at DESC
    LIMIT 1;

    IF FOUND THEN
        SELECT COUNT(*)
        INTO v_used_plays
        FROM public.video_plays
        WHERE session_id = p_session_id
          AND student_id = v_user_id;

        RETURN jsonb_build_object(
            'allowed', TRUE,
            'resumed', TRUE,
            'play_id', v_play_id,
            'play_number', v_play_number,
            'remaining_plays', GREATEST(0, 3 - v_used_plays)
        );
    END IF;

    SELECT COUNT(*)
    INTO v_used_plays
    FROM public.video_plays
    WHERE session_id = p_session_id
      AND student_id = v_user_id;

    IF v_used_plays >= 3 THEN
        RETURN jsonb_build_object(
            'allowed', FALSE,
            'reason', 'play_limit_reached',
            'used_plays', v_used_plays,
            'remaining_plays', 0
        );
    END IF;

    v_play_number := v_used_plays + 1;

    INSERT INTO public.video_plays (
        session_id,
        student_id,
        started_at,
        play_number
    )
    VALUES (
        p_session_id,
        v_user_id,
        NOW(),
        v_play_number
    )
    RETURNING id INTO v_play_id;

    RETURN jsonb_build_object(
        'allowed', TRUE,
        'resumed', FALSE,
        'play_id', v_play_id,
        'play_number', v_play_number,
        'remaining_plays', 3 - v_play_number
    );
END;
$$;


ALTER FUNCTION "public"."start_session_video"("p_session_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."start_video_play"("p_session_id" "uuid") RETURNS TABLE("playback_id" "uuid", "play_number" integer, "remaining_plays" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    v_student_id UUID;
    v_group_id UUID;
    v_session_number INTEGER;
    v_previous_session_id UUID;
    v_play_count INTEGER;
    v_play_id UUID;
    v_play_number INTEGER;
BEGIN
    v_student_id := auth.uid();

    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = v_student_id
          AND role = 'student'
    ) THEN
        RAISE EXCEPTION 'Only students can play videos';
    END IF;

    SELECT s.group_id, s.session_number
    INTO v_group_id, v_session_number
    FROM public.sessions s
    WHERE s.id = p_session_id
      AND s.is_published = TRUE;

    IF v_group_id IS NULL THEN
        RAISE EXCEPTION 'Session not found or not published';
    END IF;

    -- Lock this student's enrollment to prevent
    -- simultaneous requests from exceeding the limit.
    PERFORM 1
    FROM public.enrollments e
    WHERE e.student_id = v_student_id
      AND e.group_id = v_group_id
      AND e.status = 'active'
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'You are not enrolled in this group';
    END IF;

    -- Check whether the previous session was passed.
    SELECT s.id
    INTO v_previous_session_id
    FROM public.sessions s
    WHERE s.group_id = v_group_id
      AND s.session_number < v_session_number
      AND s.is_published = TRUE
    ORDER BY s.session_number DESC
    LIMIT 1;

    IF v_previous_session_id IS NOT NULL
       AND NOT EXISTS (
           SELECT 1
           FROM public.exams e
           JOIN public.exam_attempts a
             ON a.exam_id = e.id
           WHERE e.session_id = v_previous_session_id
             AND e.is_published = TRUE
             AND a.student_id = v_student_id
             AND a.passed = TRUE
       )
    THEN
        RAISE EXCEPTION 'You must pass the previous session exam first';
    END IF;

    -- Count all previous play attempts.
    SELECT COUNT(*)::INTEGER
    INTO v_play_count
    FROM public.video_plays vp
    WHERE vp.session_id = p_session_id
      AND vp.student_id = v_student_id;

    IF v_play_count >= 3 THEN
        RAISE EXCEPTION 'Video play limit reached';
    END IF;

    v_play_number := v_play_count + 1;
    v_play_id := gen_random_uuid();

    INSERT INTO public.video_plays (
        id,
        session_id,
        student_id,
        started_at,
        ended_at,
        play_number
    )
    VALUES (
        v_play_id,
        p_session_id,
        v_student_id,
        timezone('UTC', NOW()),
        NULL,
        v_play_number
    );

    RETURN QUERY
    SELECT
        v_play_id,
        v_play_number,
        3 - v_play_number;
END;
$$;


ALTER FUNCTION "public"."start_video_play"("p_session_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."submit_exam"("p_attempt_id" "uuid", "p_answers" "jsonb") RETURNS TABLE("score" numeric, "total_score" numeric, "percentage" numeric, "passed" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    v_student_id UUID;
    v_exam_id UUID;
    v_passing_score NUMERIC;
    v_score NUMERIC;
    v_total NUMERIC;
    v_percentage NUMERIC;
    v_passed BOOLEAN;
    v_submitted_at TIMESTAMPTZ;
BEGIN
    v_student_id := auth.uid();

    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF jsonb_typeof(p_answers) <> 'object' THEN
        RAISE EXCEPTION 'Answers must be a JSON object';
    END IF;

    -- Lock the attempt to prevent duplicate submissions.
    SELECT a.exam_id, a.submitted_at
    INTO v_exam_id, v_submitted_at
    FROM public.exam_attempts a
    WHERE a.id = p_attempt_id
      AND a.student_id = v_student_id
    FOR UPDATE;

    IF v_exam_id IS NULL THEN
        RAISE EXCEPTION 'Exam attempt not found';
    END IF;

    IF v_submitted_at IS NOT NULL THEN
        RAISE EXCEPTION 'This exam attempt has already been submitted';
    END IF;

    SELECT e.passing_score
    INTO v_passing_score
    FROM public.exams e
    WHERE e.id = v_exam_id
      AND e.is_published = TRUE;

    IF v_passing_score IS NULL THEN
        RAISE EXCEPTION 'Published exam not found';
    END IF;

    -- Reject answers for questions outside this exam.
    IF EXISTS (
        SELECT 1
        FROM jsonb_each(p_answers) AS answer(key, value)
        WHERE NOT EXISTS (
            SELECT 1
            FROM public.questions q
            WHERE q.id::text = answer.key
              AND q.exam_id = v_exam_id
        )
    ) THEN
        RAISE EXCEPTION 'Invalid question ID in submitted answers';
    END IF;

    -- Answers must be strings.
    IF EXISTS (
        SELECT 1
        FROM jsonb_each(p_answers) AS answer(key, value)
        WHERE jsonb_typeof(answer.value) <> 'string'
    ) THEN
        RAISE EXCEPTION 'Each answer must be a string';
    END IF;

    -- Calculate score on the server, never trust the frontend score.
    SELECT
        COALESCE(
            SUM(
                CASE
                    WHEN LOWER(BTRIM(COALESCE(
                        p_answers ->> q.id::text, ''
                    ))) = LOWER(BTRIM(q.correct_answer))
                    THEN q.points
                    ELSE 0
                END
            ),
            0
        ),
        COALESCE(SUM(q.points), 0)
    INTO v_score, v_total
    FROM public.questions q
    WHERE q.exam_id = v_exam_id;

    IF v_total <= 0 THEN
        RAISE EXCEPTION 'Exam has no valid points';
    END IF;

    v_percentage := ROUND((v_score / v_total) * 100, 2);
    v_passed := v_percentage >= v_passing_score;

    UPDATE public.exam_attempts
    SET
        score = v_score,
        total_score = v_total,
        passed = v_passed,
        submitted_at = NOW()
    WHERE id = p_attempt_id
      AND student_id = v_student_id;

    RETURN QUERY
    SELECT v_score, v_total, v_percentage, v_passed;
END;
$$;


ALTER FUNCTION "public"."submit_exam"("p_attempt_id" "uuid", "p_answers" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."submit_exam_attempt"("p_attempt_id" "uuid", "p_answers" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_user_id uuid;
    v_attempt record;
    v_question record;
    v_answer record;
    v_earned numeric := 0;
    v_total numeric := 0;
    v_percentage numeric := 0;
    v_passed boolean := false;
    v_answer_count integer := 0;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF p_answers IS NULL
       OR jsonb_typeof(p_answers) <> 'object' THEN
        RAISE EXCEPTION 'Answers must be a JSON object';
    END IF;

    SELECT
        ea.id,
        ea.exam_id,
        ea.student_id,
        ea.started_at,
        ea.submitted_at,
        e.duration_minutes,
        e.passing_score
    INTO v_attempt
    FROM public.exam_attempts ea
    JOIN public.exams e ON e.id = ea.exam_id
    WHERE ea.id = p_attempt_id
    FOR UPDATE OF ea;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Exam attempt not found';
    END IF;

    IF v_attempt.student_id <> v_user_id THEN
        RAISE EXCEPTION 'You cannot submit another student attempt';
    END IF;

    IF v_attempt.submitted_at IS NOT NULL THEN
        RAISE EXCEPTION 'This attempt has already been submitted';
    END IF;

    IF v_attempt.duration_minutes IS NOT NULL
       AND now() > v_attempt.started_at
           + make_interval(mins => v_attempt.duration_minutes) THEN
        RAISE EXCEPTION 'Exam time has expired';
    END IF;

    -- Validate and save submitted answers
    FOR v_answer IN
        SELECT key, value
        FROM jsonb_each_text(p_answers)
    LOOP
        IF v_answer.value IS NULL THEN
            RAISE EXCEPTION 'Answer cannot be null';
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM public.questions q
            WHERE q.id = v_answer.key::uuid
              AND q.exam_id = v_attempt.exam_id
        ) THEN
            RAISE EXCEPTION 'Invalid question in submitted answers';
        END IF;

        INSERT INTO public.exam_attempt_answers (
            attempt_id,
            question_id,
            answer_text,
            answered_at
        )
        VALUES (
            p_attempt_id,
            v_answer.key::uuid,
            v_answer.value,
            now()
        )
        ON CONFLICT (attempt_id, question_id)
        DO UPDATE SET
            answer_text = EXCLUDED.answer_text,
            answered_at = now();
    END LOOP;

    -- Calculate score from database answer key
    SELECT
        COALESCE(
            SUM(
                CASE
                    WHEN lower(trim(a.answer_text))
                       = lower(trim(q.correct_answer))
                    THEN q.points
                    ELSE 0
                END
            ), 0
        ),
        COALESCE(SUM(q.points), 0),
        COUNT(*)
    INTO v_earned, v_total, v_answer_count
    FROM public.questions q
    LEFT JOIN public.exam_attempt_answers a
      ON a.question_id = q.id
     AND a.attempt_id = p_attempt_id
    WHERE q.exam_id = v_attempt.exam_id;

    IF v_total <= 0 THEN
        RAISE EXCEPTION 'Exam has no valid points';
    END IF;

    v_percentage := (v_earned / v_total) * 100;

    v_passed :=
        v_percentage >= COALESCE(v_attempt.passing_score, 70);

    UPDATE public.exam_attempts
    SET
        score = v_earned,
        total_score = v_total,
        passed = v_passed,
        submitted_at = now()
    WHERE id = p_attempt_id;

    RETURN jsonb_build_object(
        'attempt_id', p_attempt_id,
        'score', v_earned,
        'total_score', v_total,
        'percentage', round(v_percentage, 2),
        'passing_score', COALESCE(v_attempt.passing_score, 70),
        'passed', v_passed,
        'submitted_at', now()
    );
END;
$$;


ALTER FUNCTION "public"."submit_exam_attempt"("p_attempt_id" "uuid", "p_answers" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."submit_lms_complaint"("p_subject" "text", "p_description" "text", "p_category" "text" DEFAULT 'general'::"text", "p_priority" "text" DEFAULT 'normal'::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_user_id UUID;
    v_complaint_id UUID;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF p_subject IS NULL OR LENGTH(TRIM(p_subject)) < 3 THEN
        RAISE EXCEPTION 'Subject must contain at least 3 characters';
    END IF;

    IF p_description IS NULL OR LENGTH(TRIM(p_description)) < 10 THEN
        RAISE EXCEPTION 'Description must contain at least 10 characters';
    END IF;

    IF p_priority NOT IN ('low', 'normal', 'high', 'urgent') THEN
        RAISE EXCEPTION 'Invalid complaint priority';
    END IF;

    INSERT INTO public.complaints (
        submitted_by,
        subject,
        description,
        category,
        priority,
        status
    )
    VALUES (
        v_user_id,
        TRIM(p_subject),
        TRIM(p_description),
        COALESCE(NULLIF(TRIM(p_category), ''), 'general'),
        p_priority,
        'open'
    )
    RETURNING id INTO v_complaint_id;

    RETURN v_complaint_id;
END;
$$;


ALTER FUNCTION "public"."submit_lms_complaint"("p_subject" "text", "p_description" "text", "p_category" "text", "p_priority" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_assignment_submission"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_assignment public.assignments%ROWTYPE;
    v_user_id uuid;
BEGIN
    v_user_id := auth.uid();

    SELECT *
    INTO v_assignment
    FROM public.assignments
    WHERE id = NEW.assignment_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Assignment not found.';
    END IF;

    IF TG_OP = 'INSERT' THEN

        IF v_user_id IS NULL THEN
            RAISE EXCEPTION 'Authentication required.';
        END IF;

        IF NEW.student_id <> v_user_id
           AND NOT public.is_admin() THEN
            RAISE EXCEPTION 'You can only submit your own assignment.';
        END IF;

        IF NOT public.is_admin() THEN
            IF NOT v_assignment.is_published THEN
                RAISE EXCEPTION 'This assignment is not published.';
            END IF;

            IF NOT public.is_group_student(v_assignment.group_id) THEN
                RAISE EXCEPTION 'You are not enrolled in this group.';
            END IF;

            IF v_assignment.due_at IS NOT NULL
               AND now() > v_assignment.due_at THEN
                RAISE EXCEPTION 'Assignment deadline has passed.';
            END IF;
        END IF;

        NEW.status := 'submitted';
        NEW.submitted_at := COALESCE(NEW.submitted_at, now());
        NEW.score := NULL;
        NEW.teacher_feedback := NULL;
        NEW.graded_at := NULL;
        NEW.graded_by := NULL;

        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE' THEN

        IF NEW.assignment_id <> OLD.assignment_id
           OR NEW.student_id <> OLD.student_id THEN
            RAISE EXCEPTION
            'Assignment and student ownership cannot be changed.';
        END IF;

        IF public.is_admin()
           OR public.is_group_teacher(v_assignment.group_id) THEN

            IF NEW.score IS NOT NULL
               AND (
                   NEW.score < 0
                   OR NEW.score > v_assignment.max_score
               ) THEN
                RAISE EXCEPTION
                'Score must be between 0 and maximum score (%).',
                v_assignment.max_score;
            END IF;

            IF NEW.status IN ('graded', 'returned') THEN

                IF NEW.status = 'graded' AND NEW.score IS NULL THEN
                    RAISE EXCEPTION
                    'A score is required before grading.';
                END IF;

                IF NEW.status IS DISTINCT FROM OLD.status
                   OR NEW.score IS DISTINCT FROM OLD.score
                   OR NEW.teacher_feedback IS DISTINCT FROM OLD.teacher_feedback THEN
                    NEW.graded_by := v_user_id;
                    NEW.graded_at := now();
                END IF;
            END IF;

            RETURN NEW;
        END IF;

        IF v_user_id = OLD.student_id
           AND OLD.status = 'returned' THEN

            IF NEW.status <> 'submitted' THEN
                RAISE EXCEPTION
                'A returned assignment must be resubmitted.';
            END IF;

            IF NOT v_assignment.is_published
               OR NOT public.is_group_student(v_assignment.group_id) THEN
                RAISE EXCEPTION
                'Assignment is not available for resubmission.';
            END IF;

            IF v_assignment.due_at IS NOT NULL
               AND now() > v_assignment.due_at THEN
                RAISE EXCEPTION 'Assignment deadline has passed.';
            END IF;

            NEW.score := NULL;
            NEW.teacher_feedback := NULL;
            NEW.graded_at := NULL;
            NEW.graded_by := NULL;
            NEW.submitted_at := now();

            RETURN NEW;
        END IF;

        RAISE EXCEPTION
        'You are not authorized to update this submission.';
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_assignment_submission"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_complaint"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_user_id uuid;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authenticated user is required';
    END IF;

    IF TG_OP = 'INSERT' THEN

        IF NOT public.is_admin() THEN
            NEW.submitted_by := v_user_id;
            NEW.status := 'open';
            NEW.priority := 'normal';
            NEW.assigned_to := NULL;
            NEW.admin_response := NULL;
            NEW.resolved_at := NULL;
        END IF;

        IF NEW.subject IS NULL OR trim(NEW.subject) = '' THEN
            RAISE EXCEPTION 'Complaint subject is required';
        END IF;

        IF NEW.description IS NULL OR trim(NEW.description) = '' THEN
            RAISE EXCEPTION 'Complaint description is required';
        END IF;

    ELSE

        -- Complaint owner cannot change ownership
        IF NEW.submitted_by IS DISTINCT FROM OLD.submitted_by THEN
            RAISE EXCEPTION 'Changing complaint owner is not allowed';
        END IF;

        -- Only admins can manage complaint records
        IF NOT public.is_admin() THEN
            RAISE EXCEPTION 'Only admins can update complaints';
        END IF;

    END IF;

    -- Automatically manage resolution timestamp
    IF NEW.status IN ('resolved', 'closed') THEN
        IF TG_OP = 'INSERT'
           OR OLD.status IS DISTINCT FROM NEW.status THEN
            NEW.resolved_at := now();
        END IF;
    ELSE
        NEW.resolved_at := NULL;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_complaint"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_course_material"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_user_id uuid;
    v_session_course_id uuid;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authenticated user is required';
    END IF;

    -- Set uploader automatically on insert
    IF TG_OP = 'INSERT' THEN
        NEW.uploaded_by := v_user_id;
    ELSE
        -- Prevent changing the original uploader
        IF NEW.uploaded_by IS DISTINCT FROM OLD.uploaded_by THEN
            RAISE EXCEPTION 'Changing material uploader is not allowed';
        END IF;
    END IF;

    -- Validate title and file URL
    IF NEW.title IS NULL OR trim(NEW.title) = '' THEN
        RAISE EXCEPTION 'Material title is required';
    END IF;

    IF NEW.file_url IS NULL OR trim(NEW.file_url) = '' THEN
        RAISE EXCEPTION 'Material file URL is required';
    END IF;

    -- Validate session/course consistency when both are provided
    IF NEW.session_id IS NOT NULL
       AND NEW.course_id IS NOT NULL THEN

        SELECT cg.course_id
        INTO v_session_course_id
        FROM public.sessions s
        JOIN public.course_groups cg
          ON cg.id = s.group_id
        WHERE s.id = NEW.session_id;

        IF v_session_course_id IS NULL THEN
            RAISE EXCEPTION 'Session or its course group was not found';
        END IF;

        IF v_session_course_id <> NEW.course_id THEN
            RAISE EXCEPTION 'Session does not belong to the selected course';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_course_material"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_notification_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authenticated user is required';
    END IF;

    IF NOT public.is_admin() THEN

        IF OLD.user_id <> auth.uid() THEN
            RAISE EXCEPTION 'You can only update your own notifications';
        END IF;

        IF NEW.user_id IS DISTINCT FROM OLD.user_id
           OR NEW.title IS DISTINCT FROM OLD.title
           OR NEW.message IS DISTINCT FROM OLD.message
           OR NEW.notification_type IS DISTINCT FROM OLD.notification_type
           OR NEW.related_url IS DISTINCT FROM OLD.related_url
           OR NEW.created_at IS DISTINCT FROM OLD.created_at
           OR NEW.id IS DISTINCT FROM OLD.id THEN

            RAISE EXCEPTION 'Users can only change notification read status';
        END IF;

    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_notification_update"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."ai_conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "group_id" "uuid",
    "title" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "sender" "text" NOT NULL,
    "message" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_messages_sender_check" CHECK (("sender" = ANY (ARRAY['user'::"text", 'assistant'::"text"])))
);


ALTER TABLE "public"."ai_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assignment_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assignment_id" "uuid" NOT NULL,
    "student_id" "uuid" NOT NULL,
    "submission_text" "text",
    "file_url" "text",
    "score" numeric(6,2),
    "teacher_feedback" "text",
    "status" "text" DEFAULT 'submitted'::"text" NOT NULL,
    "submitted_at" timestamp with time zone DEFAULT "now"(),
    "graded_at" timestamp with time zone,
    "graded_by" "uuid",
    CONSTRAINT "assignment_submissions_status_check" CHECK (("status" = ANY (ARRAY['submitted'::"text", 'graded'::"text", 'returned'::"text"])))
);


ALTER TABLE "public"."assignment_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "session_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "due_at" timestamp with time zone,
    "max_score" numeric(6,2) DEFAULT 100 NOT NULL,
    "is_published" boolean DEFAULT false,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "assignments_max_score_check" CHECK (("max_score" > (0)::numeric))
);


ALTER TABLE "public"."assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."attendance" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "student_id" "uuid" NOT NULL,
    "status" "text" NOT NULL,
    "recorded_by" "uuid",
    "recorded_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "attendance_status_check" CHECK (("status" = ANY (ARRAY['present'::"text", 'absent'::"text", 'late'::"text", 'excused'::"text"])))
);


ALTER TABLE "public"."attendance" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."complaints" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "submitted_by" "uuid" NOT NULL,
    "subject" "text" NOT NULL,
    "description" "text" NOT NULL,
    "category" "text",
    "priority" "text" DEFAULT 'normal'::"text" NOT NULL,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "assigned_to" "uuid",
    "admin_response" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "resolved_at" timestamp with time zone,
    CONSTRAINT "complaints_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'normal'::"text", 'high'::"text", 'urgent'::"text"]))),
    CONSTRAINT "complaints_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'in_progress'::"text", 'resolved'::"text", 'closed'::"text"])))
);


ALTER TABLE "public"."complaints" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."course_groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "course_id" "uuid" NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "start_date" "date",
    "end_date" "date",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "course_groups_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."course_groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."course_material_chunks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "material_id" "uuid" NOT NULL,
    "chunk_index" integer NOT NULL,
    "content" "text" NOT NULL,
    "embedding" "extensions"."vector"(1536),
    "embedding_model" "text" DEFAULT 'text-embedding-3-small'::"text",
    "token_count" integer,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_chunk_index" CHECK (("chunk_index" >= 0)),
    CONSTRAINT "valid_token_count" CHECK ((("token_count" IS NULL) OR ("token_count" >= 0)))
);


ALTER TABLE "public"."course_material_chunks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."course_materials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "course_id" "uuid",
    "session_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "file_url" "text" NOT NULL,
    "file_type" "text",
    "uploaded_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "rag_status" "text" DEFAULT 'pending'::"text",
    "rag_error" "text",
    "rag_processed_at" timestamp with time zone,
    "rag_chunk_count" integer DEFAULT 0,
    CONSTRAINT "course_materials_check" CHECK ((("course_id" IS NOT NULL) OR ("session_id" IS NOT NULL))),
    CONSTRAINT "course_materials_rag_chunk_count_check" CHECK (("rag_chunk_count" >= 0)),
    CONSTRAINT "course_materials_rag_status_check" CHECK (("rag_status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."course_materials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."courses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "created_by" "uuid",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "courses_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."courses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."enrollments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_id" "uuid" NOT NULL,
    "group_id" "uuid" NOT NULL,
    "enrolled_at" timestamp with time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    CONSTRAINT "enrollments_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."enrollments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."exam_attempt_answers" (
    "attempt_id" "uuid" NOT NULL,
    "question_id" "uuid" NOT NULL,
    "answer_text" "text" NOT NULL,
    "answered_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."exam_attempt_answers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."exam_attempts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "exam_id" "uuid" NOT NULL,
    "student_id" "uuid" NOT NULL,
    "score" numeric(6,2),
    "total_score" numeric(6,2),
    "passed" boolean DEFAULT false,
    "started_at" timestamp with time zone DEFAULT "now"(),
    "submitted_at" timestamp with time zone
);


ALTER TABLE "public"."exam_attempts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."exams" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "passing_score" numeric(5,2) DEFAULT 70 NOT NULL,
    "duration_minutes" integer,
    "is_published" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "exams_passing_score_check" CHECK ((("passing_score" >= (0)::numeric) AND ("passing_score" <= (100)::numeric)))
);


ALTER TABLE "public"."exams" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_billing_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "payment_type" "text" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'EGP'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "group_billing_settings_amount_check" CHECK (("amount" >= (0)::numeric)),
    CONSTRAINT "group_billing_settings_payment_type_check" CHECK (("payment_type" = ANY (ARRAY['per_session'::"text", 'monthly'::"text", 'quarterly'::"text", 'per_term'::"text", 'per_course'::"text"])))
);


ALTER TABLE "public"."group_billing_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "notification_type" "text",
    "is_read" boolean DEFAULT false NOT NULL,
    "related_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."parent_student_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parent_id" "uuid" NOT NULL,
    "student_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "parent_student_links_check" CHECK (("parent_id" <> "student_id")),
    CONSTRAINT "parent_student_links_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."parent_student_links" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_payment_id" "uuid" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "payment_method" "text" NOT NULL,
    "paid_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "recorded_by" "uuid" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "payment_transactions_amount_check" CHECK (("amount" > (0)::numeric)),
    CONSTRAINT "payment_transactions_payment_method_check" CHECK (("payment_method" = ANY (ARRAY['cash'::"text", 'instapay'::"text", 'vodafone_cash'::"text", 'bank_transfer'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."payment_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "role" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['student'::"text", 'teacher'::"text", 'parent'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "exam_id" "uuid" NOT NULL,
    "question_text" "text" NOT NULL,
    "question_type" "text" NOT NULL,
    "options" "jsonb",
    "correct_answer" "text" NOT NULL,
    "points" numeric(6,2) DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "questions_question_type_check" CHECK (("question_type" = ANY (ARRAY['mcq'::"text", 'true_false'::"text"])))
);


ALTER TABLE "public"."questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rag_ingestion_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "material_id" "uuid" NOT NULL,
    "bucket_id" "text" DEFAULT 'course-materials'::"text" NOT NULL,
    "source_file_url" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "attempts" integer DEFAULT 0 NOT NULL,
    "last_error" "text",
    "locked_at" timestamp with time zone,
    "processed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "rag_ingestion_jobs_attempts_check" CHECK (("attempts" >= 0)),
    CONSTRAINT "rag_ingestion_jobs_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."rag_ingestion_jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "session_number" integer NOT NULL,
    "video_url" "text",
    "materials_url" "text",
    "scheduled_at" timestamp with time zone,
    "is_published" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."student_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_id" "uuid" NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "group_id" "uuid" NOT NULL,
    "note" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."student_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."student_payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_id" "uuid" NOT NULL,
    "group_id" "uuid" NOT NULL,
    "session_id" "uuid",
    "amount" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'EGP'::"text" NOT NULL,
    "period_label" "text",
    "due_date" "date",
    "status" "text" DEFAULT 'unpaid'::"text" NOT NULL,
    "payment_method" "text",
    "paid_at" timestamp with time zone,
    "recorded_by" "uuid",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "waived_reason" "text",
    "waived_at" timestamp with time zone,
    "waived_by" "uuid",
    CONSTRAINT "student_payments_amount_check" CHECK (("amount" >= (0)::numeric)),
    CONSTRAINT "student_payments_payment_method_check" CHECK (("payment_method" = ANY (ARRAY['cash'::"text", 'instapay'::"text", 'vodafone_cash'::"text", 'bank_transfer'::"text", 'other'::"text"]))),
    CONSTRAINT "student_payments_status_check" CHECK (("status" = ANY (ARRAY['paid'::"text", 'unpaid'::"text", 'partially_paid'::"text", 'overdue'::"text", 'waived'::"text"])))
);


ALTER TABLE "public"."student_payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teacher_compensation" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "compensation_type" "text" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'EGP'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "teacher_compensation_amount_check" CHECK (("amount" >= (0)::numeric)),
    CONSTRAINT "teacher_compensation_compensation_type_check" CHECK (("compensation_type" = ANY (ARRAY['per_session'::"text", 'monthly'::"text", 'quarterly'::"text", 'per_term'::"text", 'per_course'::"text", 'percentage'::"text"])))
);


ALTER TABLE "public"."teacher_compensation" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teacher_earnings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "group_id" "uuid" NOT NULL,
    "session_id" "uuid",
    "amount" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'EGP'::"text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "calculated_at" timestamp with time zone DEFAULT "now"(),
    "paid_at" timestamp with time zone,
    "notes" "text",
    CONSTRAINT "teacher_earnings_amount_check" CHECK (("amount" >= (0)::numeric)),
    CONSTRAINT "teacher_earnings_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'paid'::"text"])))
);


ALTER TABLE "public"."teacher_earnings" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_assignment_submission_summary" WITH ("security_invoker"='true') AS
 SELECT "a"."id" AS "assignment_id",
    "a"."group_id",
    "a"."session_id",
    "a"."title",
    "a"."due_at",
    "a"."max_score",
    "a"."is_published",
    "a"."created_at",
    "count"("s"."id") AS "total_submissions",
    "count"("s"."id") FILTER (WHERE ("s"."status" = 'submitted'::"text")) AS "pending_submissions",
    "count"("s"."id") FILTER (WHERE ("s"."status" = 'graded'::"text")) AS "graded_submissions",
    "count"("s"."id") FILTER (WHERE ("s"."status" = 'returned'::"text")) AS "returned_submissions"
   FROM ("public"."assignments" "a"
     LEFT JOIN "public"."assignment_submissions" "s" ON (("s"."assignment_id" = "a"."id")))
  GROUP BY "a"."id", "a"."group_id", "a"."session_id", "a"."title", "a"."due_at", "a"."max_score", "a"."is_published", "a"."created_at";


ALTER VIEW "public"."v_assignment_submission_summary" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_attendance_session_summary" WITH ("security_invoker"='true') AS
 SELECT "a"."session_id",
    "s"."group_id",
    "s"."session_number",
    "s"."title" AS "session_title",
    "count"(*) AS "recorded_students",
    "count"(*) FILTER (WHERE ("a"."status" = 'present'::"text")) AS "present_count",
    "count"(*) FILTER (WHERE ("a"."status" = 'absent'::"text")) AS "absent_count",
    "count"(*) FILTER (WHERE ("a"."status" = 'late'::"text")) AS "late_count",
    "count"(*) FILTER (WHERE ("a"."status" = 'excused'::"text")) AS "excused_count"
   FROM ("public"."attendance" "a"
     JOIN "public"."sessions" "s" ON (("s"."id" = "a"."session_id")))
  GROUP BY "a"."session_id", "s"."group_id", "s"."session_number", "s"."title";


ALTER VIEW "public"."v_attendance_session_summary" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_attendance_student_summary" WITH ("security_invoker"='true') AS
 SELECT "a"."student_id",
    "s"."group_id",
    "count"(*) AS "total_recorded_sessions",
    "count"(*) FILTER (WHERE ("a"."status" = 'present'::"text")) AS "present_count",
    "count"(*) FILTER (WHERE ("a"."status" = 'absent'::"text")) AS "absent_count",
    "count"(*) FILTER (WHERE ("a"."status" = 'late'::"text")) AS "late_count",
    "count"(*) FILTER (WHERE ("a"."status" = 'excused'::"text")) AS "excused_count",
    "round"(((100.0 * ("count"(*) FILTER (WHERE ("a"."status" = ANY (ARRAY['present'::"text", 'late'::"text"]))))::numeric) / (NULLIF("count"(*) FILTER (WHERE ("a"."status" <> 'excused'::"text")), 0))::numeric), 2) AS "attendance_percentage"
   FROM ("public"."attendance" "a"
     JOIN "public"."sessions" "s" ON (("s"."id" = "a"."session_id")))
  GROUP BY "a"."student_id", "s"."group_id";


ALTER VIEW "public"."v_attendance_student_summary" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_complaints_dashboard" WITH ("security_invoker"='true') AS
 SELECT "count"(*) AS "total_complaints",
    "count"(*) FILTER (WHERE ("status" = 'open'::"text")) AS "open_complaints",
    "count"(*) FILTER (WHERE ("status" = 'in_progress'::"text")) AS "in_progress_complaints",
    "count"(*) FILTER (WHERE ("status" = 'resolved'::"text")) AS "resolved_complaints",
    "count"(*) FILTER (WHERE ("status" = 'closed'::"text")) AS "closed_complaints",
    "count"(*) FILTER (WHERE ("priority" = 'urgent'::"text")) AS "urgent_complaints",
    "count"(*) FILTER (WHERE ("created_at" >= ("now"() - '7 days'::interval))) AS "last_7_days"
   FROM "public"."complaints";


ALTER VIEW "public"."v_complaints_dashboard" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_invoice_financial_details" WITH ("security_invoker"='true') AS
 SELECT "sp"."id" AS "invoice_id",
    "sp"."student_id",
    "sp"."group_id",
    "sp"."session_id",
    "sp"."period_label",
    "sp"."amount" AS "invoice_amount",
    "sp"."currency",
    "sp"."due_date",
    "sp"."status",
    "sp"."payment_method",
    "sp"."created_at",
    COALESCE("pt"."paid_amount", (0)::numeric) AS "paid_amount",
    GREATEST(("sp"."amount" - COALESCE("pt"."paid_amount", (0)::numeric)), (0)::numeric) AS "remaining_amount",
        CASE
            WHEN ("sp"."status" = 'waived'::"text") THEN GREATEST(("sp"."amount" - COALESCE("pt"."paid_amount", (0)::numeric)), (0)::numeric)
            ELSE (0)::numeric
        END AS "waived_remaining_amount",
        CASE
            WHEN ("sp"."status" = 'waived'::"text") THEN 'waived'::"text"
            WHEN (GREATEST(("sp"."amount" - COALESCE("pt"."paid_amount", (0)::numeric)), (0)::numeric) = (0)::numeric) THEN 'paid'::"text"
            WHEN ("sp"."due_date" < CURRENT_DATE) THEN 'overdue'::"text"
            WHEN (COALESCE("pt"."paid_amount", (0)::numeric) > (0)::numeric) THEN 'partially_paid'::"text"
            ELSE 'unpaid'::"text"
        END AS "calculated_status"
   FROM ("public"."student_payments" "sp"
     LEFT JOIN ( SELECT "payment_transactions"."student_payment_id",
            "sum"("payment_transactions"."amount") AS "paid_amount"
           FROM "public"."payment_transactions"
          GROUP BY "payment_transactions"."student_payment_id") "pt" ON (("pt"."student_payment_id" = "sp"."id")));


ALTER VIEW "public"."v_invoice_financial_details" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_group_financial_summary" WITH ("security_invoker"='true') AS
 SELECT "group_id",
    "currency",
    "count"(*) AS "total_invoices",
    "sum"("invoice_amount") AS "total_invoiced",
    "sum"("paid_amount") AS "total_collected",
    "sum"("remaining_amount") AS "total_remaining",
    "sum"(
        CASE
            WHEN ("calculated_status" = 'overdue'::"text") THEN "remaining_amount"
            ELSE (0)::numeric
        END) AS "total_overdue",
    "sum"("waived_remaining_amount") AS "total_waived"
   FROM "public"."v_invoice_financial_details"
  GROUP BY "group_id", "currency";


ALTER VIEW "public"."v_group_financial_summary" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_student_group_analytics" WITH ("security_invoker"='true') AS
 SELECT "e"."student_id",
    "e"."group_id",
    "count"(DISTINCT "a"."session_id") AS "attendance_records",
    "count"(DISTINCT "a"."session_id") FILTER (WHERE ("a"."status" = 'present'::"text")) AS "present_count",
    "count"(DISTINCT "a"."session_id") FILTER (WHERE ("a"."status" = 'absent'::"text")) AS "absent_count",
    "count"(DISTINCT "a"."session_id") FILTER (WHERE ("a"."status" = 'late'::"text")) AS "late_count",
    "count"(DISTINCT "a"."session_id") FILTER (WHERE ("a"."status" = 'excused'::"text")) AS "excused_count",
    "round"(((100.0 * ("count"(DISTINCT "a"."session_id") FILTER (WHERE ("a"."status" = ANY (ARRAY['present'::"text", 'late'::"text"]))))::numeric) / (NULLIF("count"(DISTINCT "a"."session_id") FILTER (WHERE ("a"."status" = ANY (ARRAY['present'::"text", 'absent'::"text", 'late'::"text"]))), 0))::numeric), 2) AS "attendance_percentage",
    "count"(DISTINCT "ea"."id") AS "submitted_exam_attempts",
    "round"("avg"(((100.0 * "ea"."score") / NULLIF("ea"."total_score", (0)::numeric))) FILTER (WHERE (("ea"."submitted_at" IS NOT NULL) AND ("ea"."total_score" > (0)::numeric))), 2) AS "average_exam_percentage",
    "count"(DISTINCT "ass"."id") FILTER (WHERE ("ass"."status" = ANY (ARRAY['submitted'::"text", 'graded'::"text"]))) AS "submitted_assignments",
    "count"(DISTINCT "ass"."id") FILTER (WHERE ("ass"."status" = 'graded'::"text")) AS "graded_assignments",
    "round"("avg"(((100.0 * "ass"."score") / NULLIF("ast"."max_score", (0)::numeric))) FILTER (WHERE (("ass"."status" = 'graded'::"text") AND ("ast"."max_score" > (0)::numeric))), 2) AS "average_assignment_percentage"
   FROM (((("public"."enrollments" "e"
     LEFT JOIN "public"."attendance" "a" ON ((("a"."student_id" = "e"."student_id") AND ("a"."session_id" IN ( SELECT "s"."id"
           FROM "public"."sessions" "s"
          WHERE (("s"."group_id" = "e"."group_id") AND ("s"."is_published" = true)))))))
     LEFT JOIN "public"."exam_attempts" "ea" ON ((("ea"."student_id" = "e"."student_id") AND ("ea"."exam_id" IN ( SELECT "ex"."id"
           FROM ("public"."exams" "ex"
             JOIN "public"."sessions" "s" ON (("s"."id" = "ex"."session_id")))
          WHERE (("s"."group_id" = "e"."group_id") AND ("ex"."is_published" = true)))))))
     LEFT JOIN "public"."assignment_submissions" "ass" ON ((("ass"."student_id" = "e"."student_id") AND ("ass"."assignment_id" IN ( SELECT "ast_1"."id"
           FROM "public"."assignments" "ast_1"
          WHERE (("ast_1"."group_id" = "e"."group_id") AND ("ast_1"."is_published" = true)))))))
     LEFT JOIN "public"."assignments" "ast" ON (("ast"."id" = "ass"."assignment_id")))
  WHERE ("e"."status" = ANY (ARRAY['active'::"text", 'completed'::"text"]))
  GROUP BY "e"."student_id", "e"."group_id";


ALTER VIEW "public"."v_student_group_analytics" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_student_performance_summary" WITH ("security_invoker"='true') AS
 WITH "active_enrollments" AS (
         SELECT "e"."student_id",
            "e"."group_id"
           FROM "public"."enrollments" "e"
          WHERE ("e"."status" = 'active'::"text")
        ), "attendance_stats" AS (
         SELECT "a"."student_id",
            "s"."group_id",
            "count"(*) AS "recorded_sessions",
            "count"(*) FILTER (WHERE ("a"."status" = 'present'::"text")) AS "present_count",
            "count"(*) FILTER (WHERE ("a"."status" = 'absent'::"text")) AS "absent_count",
            "count"(*) FILTER (WHERE ("a"."status" = 'late'::"text")) AS "late_count",
            "count"(*) FILTER (WHERE ("a"."status" = 'excused'::"text")) AS "excused_count",
            "round"(((100.0 * ("count"(*) FILTER (WHERE ("a"."status" = ANY (ARRAY['present'::"text", 'late'::"text"]))))::numeric) / (NULLIF("count"(*) FILTER (WHERE ("a"."status" <> 'excused'::"text")), 0))::numeric), 2) AS "attendance_percentage"
           FROM ("public"."attendance" "a"
             JOIN "public"."sessions" "s" ON (("s"."id" = "a"."session_id")))
          GROUP BY "a"."student_id", "s"."group_id"
        ), "latest_exam_attempts" AS (
         SELECT DISTINCT ON ("ea"."student_id", "ea"."exam_id") "ea"."student_id",
            "ea"."exam_id",
            "ea"."score",
            "ea"."total_score",
            "ea"."passed",
            "ea"."submitted_at",
            "s"."group_id"
           FROM (("public"."exam_attempts" "ea"
             JOIN "public"."exams" "ex_1" ON (("ex_1"."id" = "ea"."exam_id")))
             JOIN "public"."sessions" "s" ON (("s"."id" = "ex_1"."session_id")))
          WHERE ("ea"."submitted_at" IS NOT NULL)
          ORDER BY "ea"."student_id", "ea"."exam_id", "ea"."submitted_at" DESC, "ea"."started_at" DESC
        ), "exam_stats" AS (
         SELECT "lea"."student_id",
            "lea"."group_id",
            "count"(*) AS "completed_exams",
            "count"(*) FILTER (WHERE ("lea"."passed" = true)) AS "passed_exams",
            "count"(*) FILTER (WHERE ("lea"."passed" = false)) AS "failed_exams",
            "round"("avg"(((100.0 * "lea"."score") / NULLIF("lea"."total_score", (0)::numeric))), 2) AS "average_exam_percentage"
           FROM "latest_exam_attempts" "lea"
          GROUP BY "lea"."student_id", "lea"."group_id"
        ), "assignment_stats" AS (
         SELECT "ae_1"."student_id",
            "a"."group_id",
            "count"("a"."id") AS "published_assignments",
            "count"("sub"."id") AS "submitted_assignments",
            "count"("sub"."id") FILTER (WHERE ("sub"."status" = 'graded'::"text")) AS "graded_assignments",
            "count"("sub"."id") FILTER (WHERE ("sub"."status" = 'returned'::"text")) AS "returned_assignments",
            "count"("sub"."id") FILTER (WHERE ("sub"."status" = 'submitted'::"text")) AS "pending_grading",
            GREATEST(("count"("a"."id") - "count"("sub"."id")), (0)::bigint) AS "missing_assignments",
            "round"("avg"(((100.0 * "sub"."score") / NULLIF("a"."max_score", (0)::numeric))) FILTER (WHERE ("sub"."score" IS NOT NULL)), 2) AS "average_assignment_percentage"
           FROM (("active_enrollments" "ae_1"
             JOIN "public"."assignments" "a" ON ((("a"."group_id" = "ae_1"."group_id") AND ("a"."is_published" = true))))
             LEFT JOIN "public"."assignment_submissions" "sub" ON ((("sub"."assignment_id" = "a"."id") AND ("sub"."student_id" = "ae_1"."student_id"))))
          GROUP BY "ae_1"."student_id", "a"."group_id"
        )
 SELECT "ae"."student_id",
    "ae"."group_id",
    COALESCE("att"."recorded_sessions", (0)::bigint) AS "recorded_sessions",
    COALESCE("att"."present_count", (0)::bigint) AS "present_count",
    COALESCE("att"."absent_count", (0)::bigint) AS "absent_count",
    COALESCE("att"."late_count", (0)::bigint) AS "late_count",
    COALESCE("att"."excused_count", (0)::bigint) AS "excused_count",
    "att"."attendance_percentage",
    COALESCE("ex"."completed_exams", (0)::bigint) AS "completed_exams",
    COALESCE("ex"."passed_exams", (0)::bigint) AS "passed_exams",
    COALESCE("ex"."failed_exams", (0)::bigint) AS "failed_exams",
    "ex"."average_exam_percentage",
    COALESCE("ast"."published_assignments", (0)::bigint) AS "published_assignments",
    COALESCE("ast"."submitted_assignments", (0)::bigint) AS "submitted_assignments",
    COALESCE("ast"."graded_assignments", (0)::bigint) AS "graded_assignments",
    COALESCE("ast"."returned_assignments", (0)::bigint) AS "returned_assignments",
    COALESCE("ast"."pending_grading", (0)::bigint) AS "pending_grading",
    COALESCE("ast"."missing_assignments", (0)::bigint) AS "missing_assignments",
    "ast"."average_assignment_percentage"
   FROM ((("active_enrollments" "ae"
     LEFT JOIN "attendance_stats" "att" ON ((("att"."student_id" = "ae"."student_id") AND ("att"."group_id" = "ae"."group_id"))))
     LEFT JOIN "exam_stats" "ex" ON ((("ex"."student_id" = "ae"."student_id") AND ("ex"."group_id" = "ae"."group_id"))))
     LEFT JOIN "assignment_stats" "ast" ON ((("ast"."student_id" = "ae"."student_id") AND ("ast"."group_id" = "ae"."group_id"))));


ALTER VIEW "public"."v_student_performance_summary" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_teacher_dashboard_groups" WITH ("security_invoker"='true') AS
 SELECT "g"."id" AS "group_id",
    "g"."name" AS "group_name",
    "g"."course_id",
    "c"."title" AS "course_title",
    "g"."teacher_id",
    "g"."status",
    "g"."start_date",
    "g"."end_date",
    "count"(DISTINCT "e"."student_id") FILTER (WHERE ("e"."status" = 'active'::"text")) AS "active_students",
    "count"(DISTINCT "s"."id") FILTER (WHERE ("s"."is_published" = true)) AS "published_sessions",
    "count"(DISTINCT "ex"."id") FILTER (WHERE ("ex"."is_published" = true)) AS "published_exams",
    "count"(DISTINCT "a"."id") FILTER (WHERE ("a"."is_published" = true)) AS "published_assignments",
    "count"(DISTINCT "ass"."id") FILTER (WHERE ("ass"."status" = 'submitted'::"text")) AS "pending_submissions"
   FROM (((((("public"."course_groups" "g"
     LEFT JOIN "public"."courses" "c" ON (("c"."id" = "g"."course_id")))
     LEFT JOIN "public"."enrollments" "e" ON (("e"."group_id" = "g"."id")))
     LEFT JOIN "public"."sessions" "s" ON (("s"."group_id" = "g"."id")))
     LEFT JOIN "public"."exams" "ex" ON (("ex"."session_id" = "s"."id")))
     LEFT JOIN "public"."assignments" "a" ON (("a"."group_id" = "g"."id")))
     LEFT JOIN "public"."assignment_submissions" "ass" ON (("ass"."assignment_id" = "a"."id")))
  WHERE (("g"."teacher_id" = "auth"."uid"()) OR "public"."is_admin"())
  GROUP BY "g"."id", "g"."name", "g"."course_id", "c"."title", "g"."teacher_id", "g"."status", "g"."start_date", "g"."end_date";


ALTER VIEW "public"."v_teacher_dashboard_groups" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_teacher_earnings_summary" WITH ("security_invoker"='true') AS
 SELECT "teacher_id",
    "group_id",
    "currency",
    "count"(*) AS "total_earning_records",
    "sum"("amount") AS "total_earnings",
    "sum"(
        CASE
            WHEN ("status" = 'pending'::"text") THEN "amount"
            ELSE (0)::numeric
        END) AS "pending_earnings",
    "sum"(
        CASE
            WHEN ("status" = 'approved'::"text") THEN "amount"
            ELSE (0)::numeric
        END) AS "approved_earnings",
    "sum"(
        CASE
            WHEN ("status" = 'paid'::"text") THEN "amount"
            ELSE (0)::numeric
        END) AS "paid_earnings"
   FROM "public"."teacher_earnings"
  GROUP BY "teacher_id", "group_id", "currency";


ALTER VIEW "public"."v_teacher_earnings_summary" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_teacher_group_overview" WITH ("security_invoker"='true') AS
 SELECT "g"."id" AS "group_id",
    "g"."name" AS "group_name",
    "g"."course_id",
    "g"."teacher_id",
    "g"."status",
    "count"(DISTINCT "e"."student_id") FILTER (WHERE ("e"."status" = 'active'::"text")) AS "active_students",
    "count"(DISTINCT "s"."id") FILTER (WHERE ("s"."is_published" = true)) AS "published_sessions",
    "count"(DISTINCT "ex"."id") FILTER (WHERE ("ex"."is_published" = true)) AS "published_exams",
    "count"(DISTINCT "ass"."id") FILTER (WHERE ("ass"."status" = 'submitted'::"text")) AS "pending_assignment_submissions"
   FROM ((((("public"."course_groups" "g"
     LEFT JOIN "public"."enrollments" "e" ON (("e"."group_id" = "g"."id")))
     LEFT JOIN "public"."sessions" "s" ON (("s"."group_id" = "g"."id")))
     LEFT JOIN "public"."exams" "ex" ON (("ex"."session_id" = "s"."id")))
     LEFT JOIN "public"."assignments" "a" ON (("a"."group_id" = "g"."id")))
     LEFT JOIN "public"."assignment_submissions" "ass" ON (("ass"."assignment_id" = "a"."id")))
  GROUP BY "g"."id", "g"."name", "g"."course_id", "g"."teacher_id", "g"."status";


ALTER VIEW "public"."v_teacher_group_overview" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_teacher_group_students" WITH ("security_invoker"='true') AS
 SELECT "e"."group_id",
    "g"."name" AS "group_name",
    "e"."student_id",
    "p"."full_name" AS "student_name",
    "p"."email",
    "p"."phone",
    "e"."enrolled_at",
    "e"."status" AS "enrollment_status"
   FROM (("public"."enrollments" "e"
     JOIN "public"."course_groups" "g" ON (("g"."id" = "e"."group_id")))
     JOIN "public"."profiles" "p" ON (("p"."id" = "e"."student_id")))
  WHERE (("g"."teacher_id" = "auth"."uid"()) OR "public"."is_admin"());


ALTER VIEW "public"."v_teacher_group_students" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_teacher_pending_submissions" WITH ("security_invoker"='true') AS
 SELECT "ass"."id" AS "submission_id",
    "ass"."assignment_id",
    "a"."title" AS "assignment_title",
    "a"."group_id",
    "g"."name" AS "group_name",
    "ass"."student_id",
    "p"."full_name" AS "student_name",
    "ass"."submitted_at",
    "ass"."submission_text",
    "ass"."file_url",
    "ass"."status",
    "a"."max_score",
    "a"."due_at"
   FROM ((("public"."assignment_submissions" "ass"
     JOIN "public"."assignments" "a" ON (("a"."id" = "ass"."assignment_id")))
     JOIN "public"."course_groups" "g" ON (("g"."id" = "a"."group_id")))
     JOIN "public"."profiles" "p" ON (("p"."id" = "ass"."student_id")))
  WHERE (("ass"."status" = 'submitted'::"text") AND (("g"."teacher_id" = "auth"."uid"()) OR "public"."is_admin"()));


ALTER VIEW "public"."v_teacher_pending_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."video_plays" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "student_id" "uuid" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"(),
    "ended_at" timestamp with time zone,
    "play_number" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."video_plays" OWNER TO "postgres";


ALTER TABLE ONLY "public"."ai_conversations"
    ADD CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_messages"
    ADD CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assignment_submissions"
    ADD CONSTRAINT "assignment_submissions_assignment_id_student_id_key" UNIQUE ("assignment_id", "student_id");



ALTER TABLE ONLY "public"."assignment_submissions"
    ADD CONSTRAINT "assignment_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assignments"
    ADD CONSTRAINT "assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attendance"
    ADD CONSTRAINT "attendance_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attendance"
    ADD CONSTRAINT "attendance_session_id_student_id_key" UNIQUE ("session_id", "student_id");



ALTER TABLE ONLY "public"."complaints"
    ADD CONSTRAINT "complaints_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."course_groups"
    ADD CONSTRAINT "course_groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."course_material_chunks"
    ADD CONSTRAINT "course_material_chunks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."course_materials"
    ADD CONSTRAINT "course_materials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_student_id_group_id_key" UNIQUE ("student_id", "group_id");



ALTER TABLE ONLY "public"."exam_attempt_answers"
    ADD CONSTRAINT "exam_attempt_answers_pkey" PRIMARY KEY ("attempt_id", "question_id");



ALTER TABLE ONLY "public"."exam_attempts"
    ADD CONSTRAINT "exam_attempts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exams"
    ADD CONSTRAINT "exams_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_billing_settings"
    ADD CONSTRAINT "group_billing_settings_group_id_key" UNIQUE ("group_id");



ALTER TABLE ONLY "public"."group_billing_settings"
    ADD CONSTRAINT "group_billing_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."parent_student_links"
    ADD CONSTRAINT "parent_student_links_parent_id_student_id_key" UNIQUE ("parent_id", "student_id");



ALTER TABLE ONLY "public"."parent_student_links"
    ADD CONSTRAINT "parent_student_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rag_ingestion_jobs"
    ADD CONSTRAINT "rag_ingestion_jobs_material_id_key" UNIQUE ("material_id");



ALTER TABLE ONLY "public"."rag_ingestion_jobs"
    ADD CONSTRAINT "rag_ingestion_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_group_id_session_number_key" UNIQUE ("group_id", "session_number");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."student_notes"
    ADD CONSTRAINT "student_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."student_payments"
    ADD CONSTRAINT "student_payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."teacher_compensation"
    ADD CONSTRAINT "teacher_compensation_group_id_key" UNIQUE ("group_id");



ALTER TABLE ONLY "public"."teacher_compensation"
    ADD CONSTRAINT "teacher_compensation_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."teacher_earnings"
    ADD CONSTRAINT "teacher_earnings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."course_material_chunks"
    ADD CONSTRAINT "unique_material_chunk" UNIQUE ("material_id", "chunk_index");



ALTER TABLE ONLY "public"."video_plays"
    ADD CONSTRAINT "video_plays_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_ai_conversations_group" ON "public"."ai_conversations" USING "btree" ("group_id");



CREATE INDEX "idx_ai_conversations_user" ON "public"."ai_conversations" USING "btree" ("user_id");



CREATE INDEX "idx_ai_conversations_user_updated" ON "public"."ai_conversations" USING "btree" ("user_id", "updated_at" DESC);



CREATE INDEX "idx_ai_messages_conversation" ON "public"."ai_messages" USING "btree" ("conversation_id", "created_at");



CREATE INDEX "idx_ai_messages_conversation_created" ON "public"."ai_messages" USING "btree" ("conversation_id", "created_at");



CREATE INDEX "idx_assignment_submissions_student" ON "public"."assignment_submissions" USING "btree" ("student_id", "assignment_id");



CREATE INDEX "idx_assignments_due_at" ON "public"."assignments" USING "btree" ("due_at");



CREATE INDEX "idx_assignments_group" ON "public"."assignments" USING "btree" ("group_id");



CREATE INDEX "idx_assignments_group_published" ON "public"."assignments" USING "btree" ("group_id", "is_published");



CREATE INDEX "idx_attempt_answers_question" ON "public"."exam_attempt_answers" USING "btree" ("question_id");



CREATE INDEX "idx_attempts_exam" ON "public"."exam_attempts" USING "btree" ("exam_id");



CREATE INDEX "idx_attempts_student" ON "public"."exam_attempts" USING "btree" ("student_id");



CREATE INDEX "idx_attendance_recorded_at" ON "public"."attendance" USING "btree" ("recorded_at");



CREATE INDEX "idx_attendance_session" ON "public"."attendance" USING "btree" ("session_id");



CREATE INDEX "idx_attendance_student" ON "public"."attendance" USING "btree" ("student_id");



CREATE INDEX "idx_attendance_student_session" ON "public"."attendance" USING "btree" ("student_id", "session_id");



CREATE INDEX "idx_attendance_student_status" ON "public"."attendance" USING "btree" ("student_id", "status");



CREATE INDEX "idx_chunks_created_at" ON "public"."course_material_chunks" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_chunks_embedding" ON "public"."course_material_chunks" USING "hnsw" ("embedding" "extensions"."vector_cosine_ops") WHERE ("embedding" IS NOT NULL);



CREATE INDEX "idx_chunks_material_id" ON "public"."course_material_chunks" USING "btree" ("material_id");



CREATE INDEX "idx_chunks_metadata" ON "public"."course_material_chunks" USING "gin" ("metadata");



CREATE INDEX "idx_complaints_assigned_to" ON "public"."complaints" USING "btree" ("assigned_to");



CREATE INDEX "idx_complaints_created_at" ON "public"."complaints" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_complaints_status" ON "public"."complaints" USING "btree" ("status");



CREATE INDEX "idx_complaints_submitter" ON "public"."complaints" USING "btree" ("submitted_by");



CREATE INDEX "idx_course_materials_rag_status" ON "public"."course_materials" USING "btree" ("rag_status");



CREATE INDEX "idx_enrollments_group" ON "public"."enrollments" USING "btree" ("group_id");



CREATE INDEX "idx_enrollments_group_status" ON "public"."enrollments" USING "btree" ("group_id", "status");



CREATE INDEX "idx_enrollments_student" ON "public"."enrollments" USING "btree" ("student_id");



CREATE INDEX "idx_exam_attempts_group_student" ON "public"."exam_attempts" USING "btree" ("student_id", "exam_id", "submitted_at" DESC) WHERE ("submitted_at" IS NOT NULL);



CREATE INDEX "idx_exam_attempts_student_submitted" ON "public"."exam_attempts" USING "btree" ("student_id", "submitted_at" DESC) WHERE ("submitted_at" IS NOT NULL);



CREATE INDEX "idx_exams_session" ON "public"."exams" USING "btree" ("session_id");



CREATE INDEX "idx_groups_course" ON "public"."course_groups" USING "btree" ("course_id");



CREATE INDEX "idx_groups_teacher" ON "public"."course_groups" USING "btree" ("teacher_id");



CREATE INDEX "idx_materials_course" ON "public"."course_materials" USING "btree" ("course_id");



CREATE INDEX "idx_materials_session" ON "public"."course_materials" USING "btree" ("session_id");



CREATE INDEX "idx_materials_uploaded_by" ON "public"."course_materials" USING "btree" ("uploaded_by");



CREATE INDEX "idx_notifications_unread" ON "public"."notifications" USING "btree" ("user_id", "created_at" DESC) WHERE ("is_read" = false);



CREATE INDEX "idx_notifications_user" ON "public"."notifications" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_notifications_user_created" ON "public"."notifications" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_parent_links_student" ON "public"."parent_student_links" USING "btree" ("student_id");



CREATE INDEX "idx_payment_transactions_invoice" ON "public"."payment_transactions" USING "btree" ("student_payment_id");



CREATE INDEX "idx_payment_transactions_paid_at" ON "public"."payment_transactions" USING "btree" ("paid_at");



CREATE INDEX "idx_questions_exam" ON "public"."questions" USING "btree" ("exam_id");



CREATE INDEX "idx_rag_jobs_pending" ON "public"."rag_ingestion_jobs" USING "btree" ("created_at") WHERE ("status" = 'pending'::"text");



CREATE INDEX "idx_rag_jobs_status" ON "public"."rag_ingestion_jobs" USING "btree" ("status");



CREATE INDEX "idx_sessions_group" ON "public"."sessions" USING "btree" ("group_id");



CREATE INDEX "idx_student_notes_student" ON "public"."student_notes" USING "btree" ("student_id");



CREATE INDEX "idx_student_payments_group" ON "public"."student_payments" USING "btree" ("group_id");



CREATE INDEX "idx_student_payments_status" ON "public"."student_payments" USING "btree" ("status");



CREATE INDEX "idx_student_payments_student" ON "public"."student_payments" USING "btree" ("student_id");



CREATE INDEX "idx_submissions_status" ON "public"."assignment_submissions" USING "btree" ("status");



CREATE INDEX "idx_submissions_student" ON "public"."assignment_submissions" USING "btree" ("student_id");



CREATE INDEX "idx_submissions_submitted_at" ON "public"."assignment_submissions" USING "btree" ("submitted_at");



CREATE INDEX "idx_teacher_earnings_group" ON "public"."teacher_earnings" USING "btree" ("group_id");



CREATE INDEX "idx_teacher_earnings_teacher" ON "public"."teacher_earnings" USING "btree" ("teacher_id");



CREATE INDEX "idx_video_plays_student_session" ON "public"."video_plays" USING "btree" ("student_id", "session_id");



CREATE UNIQUE INDEX "uq_attendance_session_student" ON "public"."attendance" USING "btree" ("session_id", "student_id");



CREATE UNIQUE INDEX "uq_student_payment_per_period" ON "public"."student_payments" USING "btree" ("student_id", "group_id", "period_label") WHERE ("session_id" IS NULL);



CREATE UNIQUE INDEX "uq_student_payment_per_session" ON "public"."student_payments" USING "btree" ("student_id", "group_id", "session_id") WHERE ("session_id" IS NOT NULL);



CREATE UNIQUE INDEX "uq_teacher_earning_per_session" ON "public"."teacher_earnings" USING "btree" ("teacher_id", "session_id") WHERE ("session_id" IS NOT NULL);



CREATE OR REPLACE TRIGGER "trg_enqueue_rag_material" AFTER INSERT OR UPDATE ON "public"."course_materials" FOR EACH ROW EXECUTE FUNCTION "public"."enqueue_rag_material"();



CREATE OR REPLACE TRIGGER "trg_notify_assignment_submission" AFTER INSERT ON "public"."assignment_submissions" FOR EACH ROW EXECUTE FUNCTION "public"."notify_assignment_submission"();



CREATE OR REPLACE TRIGGER "trg_notify_complaint_update" AFTER UPDATE OF "status", "admin_response" ON "public"."complaints" FOR EACH ROW EXECUTE FUNCTION "public"."notify_complaint_update"();



CREATE OR REPLACE TRIGGER "trg_notify_payment_transaction" AFTER INSERT ON "public"."payment_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."notify_payment_transaction"();



CREATE OR REPLACE TRIGGER "trg_notify_published_session" AFTER UPDATE OF "is_published" ON "public"."sessions" FOR EACH ROW EXECUTE FUNCTION "public"."notify_published_session"();



CREATE OR REPLACE TRIGGER "trg_validate_assignment_submission" BEFORE INSERT OR UPDATE ON "public"."assignment_submissions" FOR EACH ROW EXECUTE FUNCTION "public"."validate_assignment_submission"();



CREATE OR REPLACE TRIGGER "trg_validate_complaint" BEFORE INSERT OR UPDATE ON "public"."complaints" FOR EACH ROW EXECUTE FUNCTION "public"."validate_complaint"();



CREATE OR REPLACE TRIGGER "trg_validate_course_material" BEFORE INSERT OR UPDATE ON "public"."course_materials" FOR EACH ROW EXECUTE FUNCTION "public"."validate_course_material"();



CREATE OR REPLACE TRIGGER "trg_validate_notification_update" BEFORE UPDATE ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."validate_notification_update"();



ALTER TABLE ONLY "public"."ai_conversations"
    ADD CONSTRAINT "ai_conversations_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."course_groups"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_conversations"
    ADD CONSTRAINT "ai_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_messages"
    ADD CONSTRAINT "ai_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."ai_conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assignment_submissions"
    ADD CONSTRAINT "assignment_submissions_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assignment_submissions"
    ADD CONSTRAINT "assignment_submissions_graded_by_fkey" FOREIGN KEY ("graded_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."assignment_submissions"
    ADD CONSTRAINT "assignment_submissions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assignments"
    ADD CONSTRAINT "assignments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."assignments"
    ADD CONSTRAINT "assignments_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."course_groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assignments"
    ADD CONSTRAINT "assignments_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."attendance"
    ADD CONSTRAINT "attendance_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."attendance"
    ADD CONSTRAINT "attendance_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attendance"
    ADD CONSTRAINT "attendance_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."complaints"
    ADD CONSTRAINT "complaints_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."complaints"
    ADD CONSTRAINT "complaints_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."course_groups"
    ADD CONSTRAINT "course_groups_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."course_groups"
    ADD CONSTRAINT "course_groups_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."course_material_chunks"
    ADD CONSTRAINT "course_material_chunks_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "public"."course_materials"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."course_materials"
    ADD CONSTRAINT "course_materials_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."course_materials"
    ADD CONSTRAINT "course_materials_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."course_materials"
    ADD CONSTRAINT "course_materials_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."course_groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exam_attempt_answers"
    ADD CONSTRAINT "exam_attempt_answers_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "public"."exam_attempts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exam_attempt_answers"
    ADD CONSTRAINT "exam_attempt_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exam_attempts"
    ADD CONSTRAINT "exam_attempts_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exam_attempts"
    ADD CONSTRAINT "exam_attempts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exams"
    ADD CONSTRAINT "exams_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_billing_settings"
    ADD CONSTRAINT "group_billing_settings_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."course_groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."parent_student_links"
    ADD CONSTRAINT "parent_student_links_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."parent_student_links"
    ADD CONSTRAINT "parent_student_links_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_student_payment_id_fkey" FOREIGN KEY ("student_payment_id") REFERENCES "public"."student_payments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rag_ingestion_jobs"
    ADD CONSTRAINT "rag_ingestion_jobs_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "public"."course_materials"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."course_groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student_notes"
    ADD CONSTRAINT "student_notes_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."course_groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student_notes"
    ADD CONSTRAINT "student_notes_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student_notes"
    ADD CONSTRAINT "student_notes_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."student_payments"
    ADD CONSTRAINT "student_payments_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."course_groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student_payments"
    ADD CONSTRAINT "student_payments_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."student_payments"
    ADD CONSTRAINT "student_payments_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."student_payments"
    ADD CONSTRAINT "student_payments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student_payments"
    ADD CONSTRAINT "student_payments_waived_by_fkey" FOREIGN KEY ("waived_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."teacher_compensation"
    ADD CONSTRAINT "teacher_compensation_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."course_groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teacher_compensation"
    ADD CONSTRAINT "teacher_compensation_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."teacher_earnings"
    ADD CONSTRAINT "teacher_earnings_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."course_groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teacher_earnings"
    ADD CONSTRAINT "teacher_earnings_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."teacher_earnings"
    ADD CONSTRAINT "teacher_earnings_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."video_plays"
    ADD CONSTRAINT "video_plays_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."video_plays"
    ADD CONSTRAINT "video_plays_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Admin deletes notes" ON "public"."student_notes" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admin deletes submissions" ON "public"."assignment_submissions" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admin manages billing settings" ON "public"."group_billing_settings" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin manages courses" ON "public"."courses" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin manages enrollments" ON "public"."enrollments" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin manages exam attempts" ON "public"."exam_attempts" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin manages groups" ON "public"."course_groups" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin manages parent links" ON "public"."parent_student_links" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin manages student payments" ON "public"."student_payments" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin manages teacher compensation" ON "public"."teacher_compensation" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin manages teacher earnings" ON "public"."teacher_earnings" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins delete complaints" ON "public"."complaints" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admins manage complaints" ON "public"."complaints" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Authorized users delete materials" ON "public"."course_materials" FOR DELETE TO "authenticated" USING (("public"."is_admin"() OR (("session_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."sessions" "s"
  WHERE (("s"."id" = "course_materials"."session_id") AND "public"."is_group_teacher"("s"."group_id"))))) OR (("course_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."course_groups" "cg"
  WHERE (("cg"."course_id" = "course_materials"."course_id") AND "public"."is_group_teacher"("cg"."id")))))));



CREATE POLICY "Authorized users insert materials" ON "public"."course_materials" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin"() OR (("session_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."sessions" "s"
  WHERE (("s"."id" = "course_materials"."session_id") AND "public"."is_group_teacher"("s"."group_id"))))) OR (("course_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."course_groups" "cg"
  WHERE (("cg"."course_id" = "course_materials"."course_id") AND "public"."is_group_teacher"("cg"."id")))))));



CREATE POLICY "Authorized users update materials" ON "public"."course_materials" FOR UPDATE TO "authenticated" USING (("public"."is_admin"() OR (("session_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."sessions" "s"
  WHERE (("s"."id" = "course_materials"."session_id") AND "public"."is_group_teacher"("s"."group_id"))))) OR (("course_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."course_groups" "cg"
  WHERE (("cg"."course_id" = "course_materials"."course_id") AND "public"."is_group_teacher"("cg"."id"))))))) WITH CHECK (("public"."is_admin"() OR (("session_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."sessions" "s"
  WHERE (("s"."id" = "course_materials"."session_id") AND "public"."is_group_teacher"("s"."group_id"))))) OR (("course_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."course_groups" "cg"
  WHERE (("cg"."course_id" = "course_materials"."course_id") AND "public"."is_group_teacher"("cg"."id")))))));



CREATE POLICY "Students resubmit returned assignments" ON "public"."assignment_submissions" FOR UPDATE TO "authenticated" USING ((("student_id" = "auth"."uid"()) AND ("status" = 'returned'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."assignments" "a"
  WHERE (("a"."id" = "assignment_submissions"."assignment_id") AND ("a"."is_published" = true) AND (("a"."due_at" IS NULL) OR ("a"."due_at" >= "now"())) AND "public"."is_group_student"("a"."group_id")))))) WITH CHECK ((("student_id" = "auth"."uid"()) AND ("status" = 'submitted'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."assignments" "a"
  WHERE (("a"."id" = "assignment_submissions"."assignment_id") AND ("a"."is_published" = true) AND (("a"."due_at" IS NULL) OR ("a"."due_at" >= "now"())) AND "public"."is_group_student"("a"."group_id"))))));



CREATE POLICY "Students submit their own assignments" ON "public"."assignment_submissions" FOR INSERT TO "authenticated" WITH CHECK ((("student_id" = ( SELECT "auth"."uid"() AS "uid")) AND (EXISTS ( SELECT 1
   FROM "public"."assignments" "a"
  WHERE (("a"."id" = "assignment_submissions"."assignment_id") AND ("a"."is_published" = true) AND "public"."is_group_student"("a"."group_id"))))));



CREATE POLICY "Teachers and admins create notes" ON "public"."student_notes" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin"() OR (("teacher_id" = ( SELECT "auth"."uid"() AS "uid")) AND "public"."is_group_teacher"("group_id") AND (EXISTS ( SELECT 1
   FROM "public"."enrollments" "e"
  WHERE (("e"."student_id" = "student_notes"."student_id") AND ("e"."group_id" = "student_notes"."group_id") AND ("e"."status" = 'active'::"text")))))));



CREATE POLICY "Teachers and admins grade submissions" ON "public"."assignment_submissions" FOR UPDATE TO "authenticated" USING (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."assignments" "a"
  WHERE (("a"."id" = "assignment_submissions"."assignment_id") AND "public"."is_group_teacher"("a"."group_id")))))) WITH CHECK (("public"."is_admin"() OR ((EXISTS ( SELECT 1
   FROM "public"."assignments" "a"
  WHERE (("a"."id" = "assignment_submissions"."assignment_id") AND "public"."is_group_teacher"("a"."group_id")))) AND (EXISTS ( SELECT 1
   FROM ("public"."assignments" "a"
     JOIN "public"."enrollments" "e" ON (("e"."group_id" = "a"."group_id")))
  WHERE (("a"."id" = "assignment_submissions"."assignment_id") AND ("e"."student_id" = "assignment_submissions"."student_id") AND ("e"."status" = 'active'::"text")))))));



CREATE POLICY "Teachers and admins manage assignments" ON "public"."assignments" TO "authenticated" USING (("public"."is_admin"() OR "public"."is_group_teacher"("group_id"))) WITH CHECK (("public"."is_admin"() OR "public"."is_group_teacher"("group_id")));



CREATE POLICY "Teachers and admins manage exams" ON "public"."exams" TO "authenticated" USING (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."sessions" "s"
  WHERE (("s"."id" = "exams"."session_id") AND "public"."is_group_teacher"("s"."group_id")))))) WITH CHECK (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."sessions" "s"
  WHERE (("s"."id" = "exams"."session_id") AND "public"."is_group_teacher"("s"."group_id"))))));



CREATE POLICY "Teachers and admins manage questions" ON "public"."questions" TO "authenticated" USING (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM ("public"."exams" "e"
     JOIN "public"."sessions" "s" ON (("s"."id" = "e"."session_id")))
  WHERE (("e"."id" = "questions"."exam_id") AND "public"."is_group_teacher"("s"."group_id")))))) WITH CHECK (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM ("public"."exams" "e"
     JOIN "public"."sessions" "s" ON (("s"."id" = "e"."session_id")))
  WHERE (("e"."id" = "questions"."exam_id") AND "public"."is_group_teacher"("s"."group_id"))))));



CREATE POLICY "Teachers and admins manage sessions" ON "public"."sessions" TO "authenticated" USING (("public"."is_admin"() OR "public"."is_group_teacher"("group_id"))) WITH CHECK (("public"."is_admin"() OR "public"."is_group_teacher"("group_id")));



CREATE POLICY "Teachers and admins update notes" ON "public"."student_notes" FOR UPDATE TO "authenticated" USING (("public"."is_admin"() OR (("teacher_id" = ( SELECT "auth"."uid"() AS "uid")) AND "public"."is_group_teacher"("group_id")))) WITH CHECK (("public"."is_admin"() OR (("teacher_id" = ( SELECT "auth"."uid"() AS "uid")) AND "public"."is_group_teacher"("group_id") AND (EXISTS ( SELECT 1
   FROM "public"."enrollments" "e"
  WHERE (("e"."student_id" = "student_notes"."student_id") AND ("e"."group_id" = "student_notes"."group_id") AND ("e"."status" = 'active'::"text")))))));



CREATE POLICY "Teachers and admins view questions" ON "public"."questions" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM ("public"."exams" "e"
     JOIN "public"."sessions" "s" ON (("s"."id" = "e"."session_id")))
  WHERE (("e"."id" = "questions"."exam_id") AND "public"."is_group_teacher"("s"."group_id"))))));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Users manage their own conversations" ON "public"."ai_conversations" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users send messages to their AI conversations" ON "public"."ai_messages" FOR INSERT TO "authenticated" WITH CHECK ((("sender" = 'user'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."ai_conversations" "c"
  WHERE (("c"."id" = "ai_messages"."conversation_id") AND ("c"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users submit their own complaints" ON "public"."complaints" FOR INSERT TO "authenticated" WITH CHECK (("submitted_by" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users update own notification status" ON "public"."notifications" FOR UPDATE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"())) WITH CHECK ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "Users view own notifications" ON "public"."notifications" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "Users view their own AI messages" ON "public"."ai_messages" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."ai_conversations" "c"
  WHERE (("c"."id" = "ai_messages"."conversation_id") AND ("c"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "View accessible assignments" ON "public"."assignments" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR "public"."is_group_teacher"("group_id") OR (("is_published" = true) AND "public"."is_group_student"("group_id")) OR (("is_published" = true) AND (EXISTS ( SELECT 1
   FROM "public"."enrollments" "e"
  WHERE (("e"."group_id" = "assignments"."group_id") AND "public"."is_parent_of_student"("e"."student_id")))))));



CREATE POLICY "View accessible attempt answers" ON "public"."exam_attempt_answers" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM (("public"."exam_attempts" "ea"
     JOIN "public"."exams" "e" ON (("e"."id" = "ea"."exam_id")))
     JOIN "public"."sessions" "s" ON (("s"."id" = "e"."session_id")))
  WHERE (("ea"."id" = "exam_attempt_answers"."attempt_id") AND ("public"."is_admin"() OR ("ea"."student_id" = "auth"."uid"()) OR "public"."is_parent_of_student"("ea"."student_id") OR "public"."is_group_teacher"("s"."group_id"))))));



CREATE POLICY "View accessible complaints" ON "public"."complaints" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR ("submitted_by" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "View accessible courses" ON "public"."courses" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR ("status" = 'published'::"text") OR ("created_by" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."course_groups" "cg"
  WHERE (("cg"."course_id" = "courses"."id") AND ("public"."is_group_teacher"("cg"."id") OR "public"."is_group_student"("cg"."id") OR (EXISTS ( SELECT 1
           FROM "public"."enrollments" "e"
          WHERE (("e"."group_id" = "cg"."id") AND "public"."is_parent_of_student"("e"."student_id"))))))))));



CREATE POLICY "View accessible enrollments" ON "public"."enrollments" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR ("student_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_group_teacher"("group_id") OR "public"."is_parent_of_student"("student_id")));



CREATE POLICY "View accessible exam attempts" ON "public"."exam_attempts" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR ("student_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_parent_of_student"("student_id") OR (EXISTS ( SELECT 1
   FROM ("public"."exams" "e"
     JOIN "public"."sessions" "s" ON (("s"."id" = "e"."session_id")))
  WHERE (("e"."id" = "exam_attempts"."exam_id") AND "public"."is_group_teacher"("s"."group_id"))))));



CREATE POLICY "View accessible exams" ON "public"."exams" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."sessions" "s"
  WHERE (("s"."id" = "exams"."session_id") AND ("public"."is_group_teacher"("s"."group_id") OR (("exams"."is_published" = true) AND "public"."is_group_student"("s"."group_id")) OR (("exams"."is_published" = true) AND (EXISTS ( SELECT 1
           FROM "public"."enrollments" "e"
          WHERE (("e"."group_id" = "s"."group_id") AND "public"."is_parent_of_student"("e"."student_id")))))))))));



CREATE POLICY "View accessible groups" ON "public"."course_groups" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR ("teacher_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_group_student"("id") OR (EXISTS ( SELECT 1
   FROM "public"."enrollments" "e"
  WHERE (("e"."group_id" = "course_groups"."id") AND "public"."is_parent_of_student"("e"."student_id"))))));



CREATE POLICY "View accessible materials" ON "public"."course_materials" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR ("uploaded_by" = ( SELECT "auth"."uid"() AS "uid")) OR (("session_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."sessions" "s"
  WHERE (("s"."id" = "course_materials"."session_id") AND ("public"."is_group_teacher"("s"."group_id") OR "public"."is_group_student"("s"."group_id") OR (EXISTS ( SELECT 1
           FROM "public"."enrollments" "e"
          WHERE (("e"."group_id" = "s"."group_id") AND "public"."is_parent_of_student"("e"."student_id"))))))))) OR (("course_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."course_groups" "cg"
  WHERE (("cg"."course_id" = "course_materials"."course_id") AND ("public"."is_group_teacher"("cg"."id") OR "public"."is_group_student"("cg"."id") OR (EXISTS ( SELECT 1
           FROM "public"."enrollments" "e"
          WHERE (("e"."group_id" = "cg"."id") AND "public"."is_parent_of_student"("e"."student_id")))))))))));



CREATE POLICY "View accessible payment transactions" ON "public"."payment_transactions" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."student_payments" "sp"
  WHERE (("sp"."id" = "payment_transactions"."student_payment_id") AND (("sp"."student_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_parent_of_student"("sp"."student_id")))))));



CREATE POLICY "View accessible sessions" ON "public"."sessions" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR "public"."is_group_teacher"("group_id") OR "public"."is_group_student"("group_id") OR (EXISTS ( SELECT 1
   FROM "public"."enrollments" "e"
  WHERE (("e"."group_id" = "sessions"."group_id") AND "public"."is_parent_of_student"("e"."student_id"))))));



CREATE POLICY "View accessible student notes" ON "public"."student_notes" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR ("student_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_parent_of_student"("student_id") OR ("teacher_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "View accessible student payments" ON "public"."student_payments" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR ("student_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_parent_of_student"("student_id") OR "public"."is_group_teacher"("group_id")));



CREATE POLICY "View accessible submissions" ON "public"."assignment_submissions" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR ("student_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_parent_of_student"("student_id") OR (EXISTS ( SELECT 1
   FROM "public"."assignments" "a"
  WHERE (("a"."id" = "assignment_submissions"."assignment_id") AND "public"."is_group_teacher"("a"."group_id"))))));



CREATE POLICY "View group billing settings" ON "public"."group_billing_settings" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR "public"."is_group_teacher"("group_id") OR "public"."is_group_student"("group_id") OR (EXISTS ( SELECT 1
   FROM "public"."enrollments" "e"
  WHERE (("e"."group_id" = "group_billing_settings"."group_id") AND "public"."is_parent_of_student"("e"."student_id"))))));



CREATE POLICY "View own parent links" ON "public"."parent_student_links" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR ("parent_id" = ( SELECT "auth"."uid"() AS "uid")) OR ("student_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "View own teacher compensation" ON "public"."teacher_compensation" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR ("teacher_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "View own teacher earnings" ON "public"."teacher_earnings" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR ("teacher_id" = ( SELECT "auth"."uid"() AS "uid"))));



ALTER TABLE "public"."ai_conversations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ai_conversations_delete_own" ON "public"."ai_conversations" FOR DELETE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "ai_conversations_insert_own" ON "public"."ai_conversations" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "ai_conversations_select_own" ON "public"."ai_conversations" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "ai_conversations_update_own" ON "public"."ai_conversations" FOR UPDATE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"())) WITH CHECK ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



ALTER TABLE "public"."ai_messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ai_messages_insert_user" ON "public"."ai_messages" FOR INSERT TO "authenticated" WITH CHECK ((("sender" = 'user'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."ai_conversations" "c"
  WHERE (("c"."id" = "ai_messages"."conversation_id") AND ("c"."user_id" = "auth"."uid"()))))));



CREATE POLICY "ai_messages_select_accessible" ON "public"."ai_messages" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."ai_conversations" "c"
  WHERE (("c"."id" = "ai_messages"."conversation_id") AND (("c"."user_id" = "auth"."uid"()) OR "public"."is_admin"())))));



ALTER TABLE "public"."assignment_submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."attendance" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "attendance_delete_policy" ON "public"."attendance" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "attendance_insert_policy" ON "public"."attendance" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());



CREATE POLICY "attendance_select_policy" ON "public"."attendance" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR ("student_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."parent_student_links" "psl"
  WHERE (("psl"."student_id" = "attendance"."student_id") AND ("psl"."parent_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."sessions" "s"
  WHERE (("s"."id" = "attendance"."session_id") AND "public"."is_group_teacher"("s"."group_id"))))));



CREATE POLICY "attendance_update_policy" ON "public"."attendance" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "chunks_admin_manage" ON "public"."course_material_chunks" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "chunks_read_authorized_users" ON "public"."course_material_chunks" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."course_materials" "cm"
  WHERE (("cm"."id" = "course_material_chunks"."material_id") AND ((("cm"."course_id" IS NOT NULL) AND (EXISTS ( SELECT 1
           FROM "public"."course_groups" "cg"
          WHERE (("cg"."course_id" = "cm"."course_id") AND ("public"."is_group_teacher"("cg"."id") OR "public"."is_group_student"("cg"."id") OR (EXISTS ( SELECT 1
                   FROM "public"."enrollments" "e"
                  WHERE (("e"."group_id" = "cg"."id") AND ("e"."status" = 'active'::"text") AND "public"."is_parent_of_student"("e"."student_id"))))))))) OR (("cm"."session_id" IS NOT NULL) AND (EXISTS ( SELECT 1
           FROM "public"."sessions" "s"
          WHERE (("s"."id" = "cm"."session_id") AND ("public"."is_group_teacher"("s"."group_id") OR "public"."is_group_student"("s"."group_id") OR (EXISTS ( SELECT 1
                   FROM "public"."enrollments" "e"
                  WHERE (("e"."group_id" = "s"."group_id") AND ("e"."status" = 'active'::"text") AND "public"."is_parent_of_student"("e"."student_id")))))))))))))));



ALTER TABLE "public"."complaints" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "complaints_insert_own" ON "public"."complaints" FOR INSERT TO "authenticated" WITH CHECK ((("submitted_by" = "auth"."uid"()) AND ("status" = 'open'::"text") AND ("assigned_to" IS NULL) AND ("admin_response" IS NULL)));



CREATE POLICY "complaints_select_own_or_admin" ON "public"."complaints" FOR SELECT TO "authenticated" USING ((("submitted_by" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "complaints_update_admin" ON "public"."complaints" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



ALTER TABLE "public"."course_groups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."course_material_chunks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."course_materials" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."courses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."enrollments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."exam_attempt_answers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."exam_attempts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."exams" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_billing_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."parent_student_links" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."questions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "questions_delete_teacher_admin" ON "public"."questions" FOR DELETE TO "authenticated" USING (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM ("public"."exams" "e"
     JOIN "public"."sessions" "s" ON (("s"."id" = "e"."session_id")))
  WHERE (("e"."id" = "questions"."exam_id") AND "public"."is_group_teacher"("s"."group_id"))))));



CREATE POLICY "questions_insert_teacher_admin" ON "public"."questions" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM ("public"."exams" "e"
     JOIN "public"."sessions" "s" ON (("s"."id" = "e"."session_id")))
  WHERE (("e"."id" = "questions"."exam_id") AND "public"."is_group_teacher"("s"."group_id"))))));



CREATE POLICY "questions_select_teacher_admin" ON "public"."questions" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM ("public"."exams" "e"
     JOIN "public"."sessions" "s" ON (("s"."id" = "e"."session_id")))
  WHERE (("e"."id" = "questions"."exam_id") AND "public"."is_group_teacher"("s"."group_id"))))));



CREATE POLICY "questions_update_teacher_admin" ON "public"."questions" FOR UPDATE TO "authenticated" USING (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM ("public"."exams" "e"
     JOIN "public"."sessions" "s" ON (("s"."id" = "e"."session_id")))
  WHERE (("e"."id" = "questions"."exam_id") AND "public"."is_group_teacher"("s"."group_id")))))) WITH CHECK (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM ("public"."exams" "e"
     JOIN "public"."sessions" "s" ON (("s"."id" = "e"."session_id")))
  WHERE (("e"."id" = "questions"."exam_id") AND "public"."is_group_teacher"("s"."group_id"))))));



ALTER TABLE "public"."rag_ingestion_jobs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "rag_jobs_admin_read" ON "public"."rag_ingestion_jobs" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



ALTER TABLE "public"."sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."student_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."student_payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."teacher_compensation" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."teacher_earnings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."video_plays" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";












































































































































































































































































































































































































































































































REVOKE ALL ON FUNCTION "public"."add_ai_chat_message"("p_conversation_id" "uuid", "p_message" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."add_ai_chat_message"("p_conversation_id" "uuid", "p_message" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_ai_chat_message"("p_conversation_id" "uuid", "p_message" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_assign_complaint"("p_complaint_id" "uuid", "p_admin_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_assign_complaint"("p_complaint_id" "uuid", "p_admin_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_assign_complaint"("p_complaint_id" "uuid", "p_admin_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_generate_group_invoices"("p_group_id" "uuid", "p_period_label" "text", "p_due_date" "date", "p_session_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_generate_group_invoices"("p_group_id" "uuid", "p_period_label" "text", "p_due_date" "date", "p_session_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_generate_group_invoices"("p_group_id" "uuid", "p_period_label" "text", "p_due_date" "date", "p_session_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_generate_session_earning"("p_session_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_generate_session_earning"("p_session_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_generate_session_earning"("p_session_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_refresh_overdue_payments"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_refresh_overdue_payments"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_refresh_overdue_payments"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_reset_video_plays"("p_student_id" "uuid", "p_session_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_reset_video_plays"("p_student_id" "uuid", "p_session_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_reset_video_plays"("p_student_id" "uuid", "p_session_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_update_complaint"("p_complaint_id" "uuid", "p_status" "text", "p_admin_response" "text", "p_assigned_to" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_update_complaint"("p_complaint_id" "uuid", "p_status" "text", "p_admin_response" "text", "p_assigned_to" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_update_complaint"("p_complaint_id" "uuid", "p_status" "text", "p_admin_response" "text", "p_assigned_to" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_waive_student_payment"("p_student_payment_id" "uuid", "p_reason" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_waive_student_payment"("p_student_payment_id" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_waive_student_payment"("p_student_payment_id" "uuid", "p_reason" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."begin_exam_attempt"("p_exam_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."begin_exam_attempt"("p_exam_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."begin_exam_attempt"("p_exam_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."claim_next_rag_job"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."claim_next_rag_job"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."complete_rag_job"("p_job_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."complete_rag_job"("p_job_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_ai_chat_conversation"("p_title" "text", "p_group_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_ai_chat_conversation"("p_title" "text", "p_group_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_ai_chat_conversation"("p_title" "text", "p_group_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."current_user_role"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."current_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_role"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."end_session_video"("p_play_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."end_session_video"("p_play_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."end_session_video"("p_play_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."enqueue_rag_material"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."enqueue_rag_material"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."fail_rag_job"("p_job_id" "uuid", "p_error" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."fail_rag_job"("p_job_id" "uuid", "p_error" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."finish_video_play"("p_playback_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."finish_video_play"("p_playback_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."finish_video_play"("p_playback_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_admin_dashboard"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_admin_dashboard"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_dashboard"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_exam_questions"("p_exam_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_exam_questions"("p_exam_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."get_exam_questions"("p_exam_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_parent_dashboard"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_parent_dashboard"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_parent_dashboard"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_published_exam_questions"("p_exam_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_published_exam_questions"("p_exam_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_published_exam_questions"("p_exam_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_student_dashboard"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_student_dashboard"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_student_dashboard"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_student_group_analytics"("p_student_id" "uuid", "p_group_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_student_group_analytics"("p_student_id" "uuid", "p_group_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_student_group_analytics"("p_student_id" "uuid", "p_group_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_teacher_dashboard"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_teacher_dashboard"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_teacher_dashboard"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_unread_notifications_count"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_unread_notifications_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unread_notifications_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_admin"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_group_student"("p_group_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_group_student"("p_group_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_group_student"("p_group_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_group_student"("p_group_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_group_teacher"("p_group_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_group_teacher"("p_group_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_group_teacher"("p_group_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_group_teacher"("p_group_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_parent_of_student"("p_student_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_parent_of_student"("p_student_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_parent_of_student"("p_student_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_parent_of_student"("p_student_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."mark_all_notifications_read"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."mark_all_notifications_read"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_all_notifications_read"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."mark_notification_read"("p_notification_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."mark_notification_read"("p_notification_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_notification_read"("p_notification_id" "uuid") TO "service_role";






REVOKE ALL ON FUNCTION "public"."notify_assignment_submission"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."notify_assignment_submission"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."notify_complaint_update"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."notify_complaint_update"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."notify_payment_transaction"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."notify_payment_transaction"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."notify_published_session"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."notify_published_session"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."record_student_payment"("p_student_payment_id" "uuid", "p_amount" numeric, "p_payment_method" "text", "p_notes" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."record_student_payment"("p_student_payment_id" "uuid", "p_amount" numeric, "p_payment_method" "text", "p_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_student_payment"("p_student_payment_id" "uuid", "p_amount" numeric, "p_payment_method" "text", "p_notes" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."save_ai_assistant_reply"("p_conversation_id" "uuid", "p_message" "text", "p_metadata" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."save_ai_assistant_reply"("p_conversation_id" "uuid", "p_message" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."save_ai_assistant_reply"("p_conversation_id" "uuid", "p_message" "text", "p_metadata" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."save_ai_generated_questions"("p_exam_id" "uuid", "p_questions" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."save_ai_generated_questions"("p_exam_id" "uuid", "p_questions" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."save_ai_generated_questions"("p_exam_id" "uuid", "p_questions" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."send_lms_notification"("p_user_id" "uuid", "p_title" "text", "p_message" "text", "p_notification_type" "text", "p_related_url" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."send_lms_notification"("p_user_id" "uuid", "p_title" "text", "p_message" "text", "p_notification_type" "text", "p_related_url" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_lms_notification"("p_user_id" "uuid", "p_title" "text", "p_message" "text", "p_notification_type" "text", "p_related_url" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."start_exam"("p_exam_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."start_exam"("p_exam_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."start_exam"("p_exam_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."start_session_video"("p_session_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."start_session_video"("p_session_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."start_session_video"("p_session_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."start_video_play"("p_session_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."start_video_play"("p_session_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."start_video_play"("p_session_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."submit_exam"("p_attempt_id" "uuid", "p_answers" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."submit_exam"("p_attempt_id" "uuid", "p_answers" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."submit_exam"("p_attempt_id" "uuid", "p_answers" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."submit_exam_attempt"("p_attempt_id" "uuid", "p_answers" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."submit_exam_attempt"("p_attempt_id" "uuid", "p_answers" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."submit_exam_attempt"("p_attempt_id" "uuid", "p_answers" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."submit_lms_complaint"("p_subject" "text", "p_description" "text", "p_category" "text", "p_priority" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."submit_lms_complaint"("p_subject" "text", "p_description" "text", "p_category" "text", "p_priority" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."submit_lms_complaint"("p_subject" "text", "p_description" "text", "p_category" "text", "p_priority" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_assignment_submission"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_assignment_submission"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_assignment_submission"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_complaint"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_complaint"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_complaint"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_course_material"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_course_material"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_course_material"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_notification_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_notification_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_notification_update"() TO "service_role";






























GRANT ALL ON TABLE "public"."ai_conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_conversations" TO "service_role";



GRANT ALL ON TABLE "public"."ai_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_messages" TO "service_role";



GRANT ALL ON TABLE "public"."assignment_submissions" TO "anon";
GRANT ALL ON TABLE "public"."assignment_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."assignment_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."assignments" TO "anon";
GRANT ALL ON TABLE "public"."assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."assignments" TO "service_role";



GRANT ALL ON TABLE "public"."attendance" TO "authenticated";
GRANT ALL ON TABLE "public"."attendance" TO "service_role";



GRANT ALL ON TABLE "public"."complaints" TO "authenticated";
GRANT ALL ON TABLE "public"."complaints" TO "service_role";



GRANT ALL ON TABLE "public"."course_groups" TO "anon";
GRANT ALL ON TABLE "public"."course_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."course_groups" TO "service_role";



GRANT ALL ON TABLE "public"."course_material_chunks" TO "anon";
GRANT ALL ON TABLE "public"."course_material_chunks" TO "authenticated";
GRANT ALL ON TABLE "public"."course_material_chunks" TO "service_role";



GRANT ALL ON TABLE "public"."course_materials" TO "anon";
GRANT ALL ON TABLE "public"."course_materials" TO "authenticated";
GRANT ALL ON TABLE "public"."course_materials" TO "service_role";



GRANT ALL ON TABLE "public"."courses" TO "anon";
GRANT ALL ON TABLE "public"."courses" TO "authenticated";
GRANT ALL ON TABLE "public"."courses" TO "service_role";



GRANT ALL ON TABLE "public"."enrollments" TO "anon";
GRANT ALL ON TABLE "public"."enrollments" TO "authenticated";
GRANT ALL ON TABLE "public"."enrollments" TO "service_role";



GRANT ALL ON TABLE "public"."exam_attempt_answers" TO "service_role";
GRANT SELECT ON TABLE "public"."exam_attempt_answers" TO "authenticated";



GRANT ALL ON TABLE "public"."exam_attempts" TO "anon";
GRANT ALL ON TABLE "public"."exam_attempts" TO "authenticated";
GRANT ALL ON TABLE "public"."exam_attempts" TO "service_role";



GRANT ALL ON TABLE "public"."exams" TO "anon";
GRANT ALL ON TABLE "public"."exams" TO "authenticated";
GRANT ALL ON TABLE "public"."exams" TO "service_role";



GRANT ALL ON TABLE "public"."group_billing_settings" TO "anon";
GRANT ALL ON TABLE "public"."group_billing_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."group_billing_settings" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "service_role";
GRANT SELECT ON TABLE "public"."notifications" TO "authenticated";



GRANT UPDATE("is_read") ON TABLE "public"."notifications" TO "authenticated";



GRANT ALL ON TABLE "public"."parent_student_links" TO "anon";
GRANT ALL ON TABLE "public"."parent_student_links" TO "authenticated";
GRANT ALL ON TABLE "public"."parent_student_links" TO "service_role";



GRANT ALL ON TABLE "public"."payment_transactions" TO "service_role";
GRANT SELECT ON TABLE "public"."payment_transactions" TO "authenticated";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT UPDATE("full_name") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("phone") ON TABLE "public"."profiles" TO "authenticated";



GRANT ALL ON TABLE "public"."questions" TO "authenticated";
GRANT ALL ON TABLE "public"."questions" TO "service_role";



GRANT ALL ON TABLE "public"."rag_ingestion_jobs" TO "anon";
GRANT ALL ON TABLE "public"."rag_ingestion_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."rag_ingestion_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."sessions" TO "anon";
GRANT ALL ON TABLE "public"."sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."sessions" TO "service_role";



GRANT ALL ON TABLE "public"."student_notes" TO "anon";
GRANT ALL ON TABLE "public"."student_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."student_notes" TO "service_role";



GRANT ALL ON TABLE "public"."student_payments" TO "anon";
GRANT ALL ON TABLE "public"."student_payments" TO "authenticated";
GRANT ALL ON TABLE "public"."student_payments" TO "service_role";



GRANT ALL ON TABLE "public"."teacher_compensation" TO "anon";
GRANT ALL ON TABLE "public"."teacher_compensation" TO "authenticated";
GRANT ALL ON TABLE "public"."teacher_compensation" TO "service_role";



GRANT ALL ON TABLE "public"."teacher_earnings" TO "anon";
GRANT ALL ON TABLE "public"."teacher_earnings" TO "authenticated";
GRANT ALL ON TABLE "public"."teacher_earnings" TO "service_role";



GRANT ALL ON TABLE "public"."v_assignment_submission_summary" TO "anon";
GRANT ALL ON TABLE "public"."v_assignment_submission_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."v_assignment_submission_summary" TO "service_role";



GRANT ALL ON TABLE "public"."v_attendance_session_summary" TO "anon";
GRANT ALL ON TABLE "public"."v_attendance_session_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."v_attendance_session_summary" TO "service_role";



GRANT ALL ON TABLE "public"."v_attendance_student_summary" TO "anon";
GRANT ALL ON TABLE "public"."v_attendance_student_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."v_attendance_student_summary" TO "service_role";



GRANT ALL ON TABLE "public"."v_complaints_dashboard" TO "anon";
GRANT ALL ON TABLE "public"."v_complaints_dashboard" TO "authenticated";
GRANT ALL ON TABLE "public"."v_complaints_dashboard" TO "service_role";



GRANT ALL ON TABLE "public"."v_invoice_financial_details" TO "anon";
GRANT ALL ON TABLE "public"."v_invoice_financial_details" TO "authenticated";
GRANT ALL ON TABLE "public"."v_invoice_financial_details" TO "service_role";



GRANT ALL ON TABLE "public"."v_group_financial_summary" TO "anon";
GRANT ALL ON TABLE "public"."v_group_financial_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."v_group_financial_summary" TO "service_role";



GRANT ALL ON TABLE "public"."v_student_group_analytics" TO "anon";
GRANT ALL ON TABLE "public"."v_student_group_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."v_student_group_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."v_student_performance_summary" TO "anon";
GRANT ALL ON TABLE "public"."v_student_performance_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."v_student_performance_summary" TO "service_role";



GRANT ALL ON TABLE "public"."v_teacher_dashboard_groups" TO "anon";
GRANT ALL ON TABLE "public"."v_teacher_dashboard_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."v_teacher_dashboard_groups" TO "service_role";



GRANT ALL ON TABLE "public"."v_teacher_earnings_summary" TO "anon";
GRANT ALL ON TABLE "public"."v_teacher_earnings_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."v_teacher_earnings_summary" TO "service_role";



GRANT ALL ON TABLE "public"."v_teacher_group_overview" TO "anon";
GRANT ALL ON TABLE "public"."v_teacher_group_overview" TO "authenticated";
GRANT ALL ON TABLE "public"."v_teacher_group_overview" TO "service_role";



GRANT ALL ON TABLE "public"."v_teacher_group_students" TO "anon";
GRANT ALL ON TABLE "public"."v_teacher_group_students" TO "authenticated";
GRANT ALL ON TABLE "public"."v_teacher_group_students" TO "service_role";



GRANT ALL ON TABLE "public"."v_teacher_pending_submissions" TO "anon";
GRANT ALL ON TABLE "public"."v_teacher_pending_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."v_teacher_pending_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."video_plays" TO "anon";
GRANT ALL ON TABLE "public"."video_plays" TO "authenticated";
GRANT ALL ON TABLE "public"."video_plays" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































