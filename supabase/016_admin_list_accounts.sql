-- 016_admin_list_accounts.sql
-- 讓管理員在「帳號設定」頁看到所有帳號與屬性（管理員／護理師／一般人員）
-- auth.users 前端無法直接讀取，以 SECURITY DEFINER 函式提供，且僅限管理員呼叫
-- 在 Supabase Dashboard > SQL Editor 貼上執行

CREATE OR REPLACE FUNCTION public.admin_list_accounts()
RETURNS TABLE (
  id uuid, email text, role text, display_name text,
  approval_status text, created_at timestamptz, last_sign_in_at timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth
AS $$
BEGIN
  IF COALESCE(auth.jwt()->'user_metadata'->>'role', '') <> 'admin'
     AND COALESCE(auth.jwt()->>'email', '') NOT IN
       ('amuy.chen@gmail.com', 'dawadorge@gmail.com', 'nina0626790@gmail.com') THEN
    RAISE EXCEPTION '僅限管理員';
  END IF;
  RETURN QUERY
    SELECT u.id, u.email::text,
           COALESCE(u.raw_user_meta_data->>'role', '')::text,
           COALESCE(u.raw_user_meta_data->>'display_name', '')::text,
           COALESCE(a.status, 'approved')::text,
           u.created_at, u.last_sign_in_at
    FROM auth.users u
    LEFT JOIN public.user_approvals a ON a.id = u.id
    ORDER BY u.created_at;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_accounts() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_accounts() TO authenticated;
