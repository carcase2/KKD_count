-- [20260404270000] 'pending' 상태 추가
-- PostgreSQL에서 enum 값을 트랜잭션 외부에서 추가해야 할 수도 있으므로 별도 실행 권장

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'task_status' AND e.enumlabel = 'pending') THEN
        ALTER TYPE public.task_status ADD VALUE 'pending' AFTER 'in_progress';
    END IF;
END $$;
