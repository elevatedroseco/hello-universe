-- Import all ppm_assets into custom_units
-- Using the correct storage path format: units/filename.shp

INSERT INTO custom_units (internal_name, name, shp_file_path, rules_json)
SELECT 
  asset_code,
  name,
  CASE 
    WHEN shp_filename IS NOT NULL THEN 'units/' || shp_filename
    ELSE NULL
  END,
  jsonb_build_object(
    'Category', category,
    'Owner', faction,
    'Cost', COALESCE(suggested_cost, 0),
    'Strength', COALESCE(suggested_strength, 100),
    'Speed', COALESCE(suggested_speed, 5),
    'TechLevel', 1,
    'Prerequisite', CASE 
      WHEN category = 'Infantry' THEN 'BARRACKS'
      WHEN category = 'Vehicle' THEN 'FACTORY'
      WHEN category = 'Aircraft' THEN 'HELIPAD'
      ELSE 'BARRACKS'
    END,
    'Armor', CASE 
      WHEN category = 'Vehicle' THEN 'heavy'
      ELSE 'none'
    END
  )
FROM ppm_assets
WHERE asset_code NOT IN (SELECT internal_name FROM custom_units)
ORDER BY name;