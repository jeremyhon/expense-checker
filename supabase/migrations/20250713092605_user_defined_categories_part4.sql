-- Part 4: Helper functions

-- Function to handle category deletion with expense reassignment
CREATE OR REPLACE FUNCTION public.delete_category_with_reassignment(
  p_category_id UUID,
  p_target_category_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_deleted_count INT;
  v_reassigned_count INT := 0;
BEGIN
  -- Get the user_id for the category
  SELECT user_id INTO v_user_id FROM public.categories WHERE id = p_category_id;
  
  -- Verify both categories belong to the same user
  IF p_target_category_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.categories 
      WHERE id = p_target_category_id AND user_id = v_user_id
    ) THEN
      RAISE EXCEPTION 'Target category does not exist or belongs to different user';
    END IF;
    
    -- Reassign expenses to target category
    UPDATE public.expenses 
    SET category_id = p_target_category_id 
    WHERE category_id = p_category_id;
    
    GET DIAGNOSTICS v_reassigned_count = ROW_COUNT;
  ELSE
    -- Count expenses that will be deleted
    SELECT COUNT(*) INTO v_deleted_count 
    FROM public.expenses 
    WHERE category_id = p_category_id;
    
    -- Delete expenses (cascade will handle this due to FK constraint)
    DELETE FROM public.expenses WHERE category_id = p_category_id;
  END IF;
  
  -- Delete the category
  DELETE FROM public.categories WHERE id = p_category_id;
  
  -- Return summary
  RETURN json_build_object(
    'success', true,
    'reassigned_count', v_reassigned_count,
    'deleted_count', COALESCE(v_deleted_count, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_category_with_reassignment TO authenticated;