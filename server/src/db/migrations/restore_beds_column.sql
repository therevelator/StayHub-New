SELECT 
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rooms' AND column_name = 'room_size')
        THEN 'ALTER TABLE rooms ADD COLUMN room_size INT;'
    END as migration_1,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rooms' AND column_name = 'view_type')
        THEN 'ALTER TABLE rooms ADD COLUMN view_type VARCHAR(50);'
    END as migration_2,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rooms' AND column_name = 'has_private_bathroom')
        THEN 'ALTER TABLE rooms ADD COLUMN has_private_bathroom BOOLEAN DEFAULT true;'
    END as migration_3,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rooms' AND column_name = 'smoking')
        THEN 'ALTER TABLE rooms ADD COLUMN smoking BOOLEAN DEFAULT false;'
    END as migration_4,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rooms' AND column_name = 'accessibility_features')
        THEN 'ALTER TABLE rooms ADD COLUMN accessibility_features JSON;'
    END as migration_5,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rooms' AND column_name = 'floor_level')
        THEN 'ALTER TABLE rooms ADD COLUMN floor_level INT;'
    END as migration_6,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rooms' AND column_name = 'has_balcony')
        THEN 'ALTER TABLE rooms ADD COLUMN has_balcony BOOLEAN DEFAULT false;'
    END as migration_7,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rooms' AND column_name = 'has_kitchen')
        THEN 'ALTER TABLE rooms ADD COLUMN has_kitchen BOOLEAN DEFAULT false;'
    END as migration_8,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rooms' AND column_name = 'has_minibar')
        THEN 'ALTER TABLE rooms ADD COLUMN has_minibar BOOLEAN DEFAULT false;'
    END as migration_9,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rooms' AND column_name = 'climate')
        THEN 'ALTER TABLE rooms ADD COLUMN climate JSON;'
    END as migration_10,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rooms' AND column_name = 'price_per_night')
        THEN 'ALTER TABLE rooms ADD COLUMN price_per_night DECIMAL(10,2);'
    END as migration_11,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rooms' AND column_name = 'cancellation_policy')
        THEN 'ALTER TABLE rooms ADD COLUMN cancellation_policy VARCHAR(50);'
    END as migration_12,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rooms' AND column_name = 'includes_breakfast')
        THEN 'ALTER TABLE rooms ADD COLUMN includes_breakfast BOOLEAN DEFAULT false;'
    END as migration_13,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rooms' AND column_name = 'extra_bed_available')
        THEN 'ALTER TABLE rooms ADD COLUMN extra_bed_available BOOLEAN DEFAULT false;'
    END as migration_14,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rooms' AND column_name = 'pets_allowed')
        THEN 'ALTER TABLE rooms ADD COLUMN pets_allowed BOOLEAN DEFAULT false;'
    END as migration_15,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rooms' AND column_name = 'images')
        THEN 'ALTER TABLE rooms ADD COLUMN images JSON;'
    END as migration_16,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rooms' AND column_name = 'cleaning_frequency')
        THEN 'ALTER TABLE rooms ADD COLUMN cleaning_frequency VARCHAR(50);'
    END as migration_17,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rooms' AND column_name = 'has_toiletries')
        THEN 'ALTER TABLE rooms ADD COLUMN has_toiletries BOOLEAN DEFAULT false;'
    END as migration_18,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rooms' AND column_name = 'has_towels_linens')
        THEN 'ALTER TABLE rooms ADD COLUMN has_towels_linens BOOLEAN DEFAULT false;'
    END as migration_19,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rooms' AND column_name = 'has_room_service')
        THEN 'ALTER TABLE rooms ADD COLUMN has_room_service BOOLEAN DEFAULT false;'
    END as migration_20,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rooms' AND column_name = 'flooring_type')
        THEN 'ALTER TABLE rooms ADD COLUMN flooring_type VARCHAR(50);'
    END as migration_21,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rooms' AND column_name = 'energy_saving_features')
        THEN 'ALTER TABLE rooms ADD COLUMN energy_saving_features JSON;'
    END as migration_22,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rooms' AND column_name = 'status')
        THEN 'ALTER TABLE rooms ADD COLUMN status VARCHAR(20) DEFAULT "available";'
    END as migration_23
INTO @m1, @m2, @m3, @m4, @m5, @m6, @m7, @m8, @m9, @m10, @m11, @m12, @m13, @m14, @m15, @m16, @m17, @m18, @m19, @m20, @m21, @m22, @m23;

SET @sql = CONCAT(
    COALESCE(@m1, ''),
    COALESCE(@m2, ''),
    COALESCE(@m3, ''),
    COALESCE(@m4, ''),
    COALESCE(@m5, ''),
    COALESCE(@m6, ''),
    COALESCE(@m7, ''),
    COALESCE(@m8, ''),
    COALESCE(@m9, ''),
    COALESCE(@m10, ''),
    COALESCE(@m11, ''),
    COALESCE(@m12, ''),
    COALESCE(@m13, ''),
    COALESCE(@m14, ''),
    COALESCE(@m15, ''),
    COALESCE(@m16, ''),
    COALESCE(@m17, ''),
    COALESCE(@m18, ''),
    COALESCE(@m19, ''),
    COALESCE(@m20, ''),
    COALESCE(@m21, ''),
    COALESCE(@m22, ''),
    COALESCE(@m23, '')
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
