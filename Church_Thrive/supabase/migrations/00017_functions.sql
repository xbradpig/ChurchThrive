-- Function to compute chosung (Korean initial consonant extraction)
CREATE OR REPLACE FUNCTION compute_chosung(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
  result TEXT := '';
  ch TEXT;
  code INTEGER;
  chosung_index INTEGER;
  chosung_list TEXT[] := ARRAY['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  i INTEGER;
BEGIN
  FOR i IN 1..char_length(input_text) LOOP
    ch := substr(input_text, i, 1);
    code := ascii(ch);
    IF code >= 44032 AND code <= 55203 THEN
      chosung_index := (code - 44032) / 588;
      result := result || chosung_list[chosung_index + 1];
    ELSE
      result := result || ch;
    END IF;
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger function to auto-compute chosung on member name insert/update
CREATE OR REPLACE FUNCTION trigger_compute_chosung()
RETURNS TRIGGER AS $$
BEGIN
  NEW.name_chosung := compute_chosung(NEW.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_members_chosung
  BEFORE INSERT OR UPDATE OF name ON members
  FOR EACH ROW
  EXECUTE FUNCTION trigger_compute_chosung();

-- Trigger function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables with updated_at column
CREATE TRIGGER trg_churches_updated_at
  BEFORE UPDATE ON churches
  FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();

CREATE TRIGGER trg_members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();

CREATE TRIGGER trg_sermons_updated_at
  BEFORE UPDATE ON sermons
  FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();

CREATE TRIGGER trg_sermon_notes_updated_at
  BEFORE UPDATE ON sermon_notes
  FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();

CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();

CREATE TRIGGER trg_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();

CREATE TRIGGER trg_cell_groups_updated_at
  BEFORE UPDATE ON cell_groups
  FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();
