-- Ensure minimum age does not exceed maximum age
ALTER TABLE "items"
ADD CONSTRAINT "items_age_range_check"
CHECK (
  "age_min_months" IS NULL
  OR "age_max_months" IS NULL
  OR "age_min_months" <= "age_max_months"
);

-- Ensure photo position is not negative
ALTER TABLE "item_photos"
ADD CONSTRAINT "item_photos_position_check"
CHECK ("position" >= 0);