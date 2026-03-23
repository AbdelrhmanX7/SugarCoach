-- Add 'accu_chek' to the allowed sources for blood_sugar_readings
ALTER TABLE blood_sugar_readings
  DROP CONSTRAINT blood_sugar_readings_source_check;

ALTER TABLE blood_sugar_readings
  ADD CONSTRAINT blood_sugar_readings_source_check
  CHECK (source IN ('manual', 'libre', 'dexcom', 'mysugr', 'ai_chat', 'accu_chek'));
