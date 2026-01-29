-- Function to calculate average rating and count
CREATE OR REPLACE FUNCTION update_property_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE properties
    SET 
        rating = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE property_id = NEW.property_id),
        reviews_count = (SELECT COUNT(*) FROM reviews WHERE property_id = NEW.property_id)
    WHERE id = NEW.property_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run after review insert/update/delete
DROP TRIGGER IF EXISTS on_review_change ON reviews;
CREATE TRIGGER on_review_change
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_property_rating();

-- Run once to fix existing data
UPDATE properties p
SET 
    rating = (SELECT COALESCE(AVG(rating), 0) FROM reviews r WHERE r.property_id = p.id),
    reviews_count = (SELECT COUNT(*) FROM reviews r WHERE r.property_id = p.id);
