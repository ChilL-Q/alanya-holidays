
SELECT 
    event_object_table AS table_name, 
    trigger_name, 
    action_statement AS trigger_action,
    action_orientation,
    action_timing
FROM 
    information_schema.triggers
WHERE 
    event_object_schema = 'public'
ORDER BY 
    event_object_table, 
    trigger_name;
