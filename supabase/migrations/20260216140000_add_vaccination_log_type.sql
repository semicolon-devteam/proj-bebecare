-- baby_logs log_type에 vaccination 추가
ALTER TABLE baby_logs DROP CONSTRAINT IF EXISTS baby_logs_log_type_check;
ALTER TABLE baby_logs ADD CONSTRAINT baby_logs_log_type_check
  CHECK (log_type IN ('formula', 'baby_food', 'breast', 'diaper', 'sleep', 'bath', 'medicine', 'vaccination'));
