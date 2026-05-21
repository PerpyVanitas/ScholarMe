-- =============================================
-- Advanced Analytics & Semester Config Migration
-- =============================================

-- 1. Create Semester Configs Table
CREATE TABLE IF NOT EXISTS public.semester_configs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    is_active boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Ensure only one active semester at a time
CREATE UNIQUE INDEX semester_configs_active_idx ON public.semester_configs (is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.semester_configs ENABLE ROW LEVEL SECURITY;

-- Policies for Semester Configs
CREATE POLICY "Admins can manage semester configs" 
    ON public.semester_configs 
    FOR ALL 
    TO authenticated 
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Anyone can view active semester" 
    ON public.semester_configs 
    FOR SELECT 
    TO authenticated 
    USING (true);

-- NOTE: No default semester is seeded here.
-- An administrator must configure the active semester via the
-- Admin Analytics page → "Config Semester" button before 90-hour
-- tracking will be active.

-- 2. Advanced Analytics RPC
CREATE OR REPLACE FUNCTION public.get_advanced_analytics()
RETURNS json
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    active_semester record;
    result json;
    compliance_data json;
    hall_of_fame json;
    supply_demand json;
BEGIN
    -- Only allow admins
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Get the active semester
    SELECT * INTO active_semester FROM public.semester_configs WHERE is_active = true LIMIT 1;

    IF active_semester IS NULL THEN
        RAISE EXCEPTION 'No active semester configured';
    END IF;

    -- A. 90-Hour Compliance (Tutors only)
    -- 90 hours = 5400 minutes
    SELECT json_agg(
        json_build_object(
            'tutor_id', t.id,
            'full_name', p.full_name,
            'avatar_url', p.avatar_url,
            'total_minutes', COALESCE(s_agg.total_minutes, 0),
            'sessions_count', COALESCE(s_agg.sessions_count, 0),
            'is_compliant', COALESCE(s_agg.total_minutes, 0) >= 5400,
            'progress_percentage', LEAST(100, ROUND((COALESCE(s_agg.total_minutes, 0)::numeric / 5400) * 100, 1))
        )
    ) INTO compliance_data
    FROM public.tutors t
    JOIN public.profiles p ON t.id = p.id
    LEFT JOIN (
        SELECT tutor_id, 
               SUM(duration_minutes) as total_minutes,
               COUNT(*) as sessions_count
        FROM public.sessions
        WHERE status = 'completed' 
          AND scheduled_date >= active_semester.start_date 
          AND scheduled_date <= active_semester.end_date
        GROUP BY tutor_id
    ) s_agg ON t.id = s_agg.tutor_id;

    -- B. Hall of Fame
    -- Most Hours Served (Semester)
    WITH semester_stats AS (
        SELECT tutor_id, SUM(duration_minutes) as total_mins, COUNT(DISTINCT learner_id) as unique_students, COUNT(*) as session_count
        FROM public.sessions
        WHERE status = 'completed' AND scheduled_date >= active_semester.start_date AND scheduled_date <= active_semester.end_date
        GROUP BY tutor_id
    )
    SELECT json_build_object(
        'most_hours', (
            SELECT json_build_object('tutor_id', p.id, 'full_name', p.full_name, 'value', ss.total_mins)
            FROM semester_stats ss JOIN public.profiles p ON ss.tutor_id = p.id
            ORDER BY ss.total_mins DESC NULLS LAST LIMIT 1
        ),
        'best_rating', (
            SELECT json_build_object('tutor_id', p.id, 'full_name', p.full_name, 'value', t.rating)
            FROM public.tutors t JOIN public.profiles p ON t.id = p.id
            WHERE t.total_ratings >= 5
            ORDER BY t.rating DESC NULLS LAST LIMIT 1
        ),
        'most_students', (
            SELECT json_build_object('tutor_id', p.id, 'full_name', p.full_name, 'value', ss.unique_students)
            FROM semester_stats ss JOIN public.profiles p ON ss.tutor_id = p.id
            ORDER BY ss.unique_students DESC NULLS LAST LIMIT 1
        ),
        'most_xp', (
            SELECT json_build_object('user_id', p.id, 'full_name', p.full_name, 'value', p.total_xp)
            FROM public.profiles p
            ORDER BY p.total_xp DESC NULLS LAST LIMIT 1
        )
    ) INTO hall_of_fame;

    -- C. Supply vs Demand
    -- Supply: Count of tutors per specialization
    -- Demand: Count of sessions per specialization (all time or semester)
    SELECT json_agg(
        json_build_object(
            'subject_name', spec.name,
            'supply_count', (SELECT COUNT(*) FROM public.tutor_specializations ts WHERE ts.specialization_id = spec.id),
            'demand_count', (SELECT COUNT(*) FROM public.sessions s WHERE s.subject_id = spec.id)
        )
    ) INTO supply_demand
    FROM public.specializations spec;

    -- Build final result
    result := json_build_object(
        'semester', json_build_object(
            'id', active_semester.id,
            'name', active_semester.name,
            'start_date', active_semester.start_date,
            'end_date', active_semester.end_date
        ),
        'compliance', COALESCE(compliance_data, '[]'::json),
        'hall_of_fame', hall_of_fame,
        'supply_demand', COALESCE(supply_demand, '[]'::json)
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql;
