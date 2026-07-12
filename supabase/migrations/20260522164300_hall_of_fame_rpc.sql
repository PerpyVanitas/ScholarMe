SET statement_timeout = 0;
-- =============================================
-- Hall of Fame RPC Migration
-- =============================================

-- Creates a dedicated RPC for the Hall of Fame that accepts a dynamic timeframe
-- and returns the best overall, best month, and best week within that timeframe.

CREATE OR REPLACE FUNCTION public.get_hall_of_fame(timeframe_start date, timeframe_end date)
RETURNS json
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result json;
BEGIN
    -- Only allow admins
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Aggregate Overall (Best tutor across the entire selected timeframe)
    WITH overall_stats AS (
        SELECT tutor_id, SUM(duration_minutes) as total_mins
        FROM public.sessions
        WHERE status = 'completed' AND scheduled_date >= timeframe_start AND scheduled_date <= timeframe_end
        GROUP BY tutor_id
    ),
    
    -- Aggregate by Month
    month_stats AS (
        SELECT 
            tutor_id, 
            date_trunc('month', scheduled_date) as month_start, 
            SUM(duration_minutes) as total_mins
        FROM public.sessions
        WHERE status = 'completed' AND scheduled_date >= timeframe_start AND scheduled_date <= timeframe_end
        GROUP BY tutor_id, date_trunc('month', scheduled_date)
    ),
    
    -- Aggregate by Week
    week_stats AS (
        SELECT 
            tutor_id, 
            date_trunc('week', scheduled_date) as week_start, 
            SUM(duration_minutes) as total_mins
        FROM public.sessions
        WHERE status = 'completed' AND scheduled_date >= timeframe_start AND scheduled_date <= timeframe_end
        GROUP BY tutor_id, date_trunc('week', scheduled_date)
    )
    
    SELECT json_build_object(
        'most_hours_overall', (
            SELECT json_build_object('tutor_id', p.id, 'full_name', p.full_name, 'value', os.total_mins)
            FROM overall_stats os JOIN public.profiles p ON os.tutor_id = p.id
            ORDER BY os.total_mins DESC NULLS LAST LIMIT 1
        ),
        'best_month', (
            SELECT json_build_object(
                'tutor_id', p.id, 
                'full_name', p.full_name, 
                'value', ms.total_mins,
                'period_label', to_char(ms.month_start, 'FMMonth YYYY') -- e.g., "May 2026"
            )
            FROM month_stats ms JOIN public.profiles p ON ms.tutor_id = p.id
            ORDER BY ms.total_mins DESC NULLS LAST LIMIT 1
        ),
        'best_week', (
            SELECT json_build_object(
                'tutor_id', p.id, 
                'full_name', p.full_name, 
                'value', ws.total_mins,
                'period_label', 'Week of ' || to_char(ws.week_start, 'FMMonth DD, YYYY') -- e.g., "Week of May 4, 2026"
            )
            FROM week_stats ws JOIN public.profiles p ON ws.tutor_id = p.id
            ORDER BY ws.total_mins DESC NULLS LAST LIMIT 1
        )
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

