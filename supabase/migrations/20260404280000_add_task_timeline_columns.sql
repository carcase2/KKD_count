-- [20260404280000] 업무 시작일 및 완료일 컬럼 추가

ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS started_at DATE,
ADD COLUMN IF NOT EXISTS finished_at DATE;

COMMENT ON COLUMN public.tasks.started_at IS '업무 실제 시작일';
COMMENT ON COLUMN public.tasks.finished_at IS '업무 실제 완료일';
