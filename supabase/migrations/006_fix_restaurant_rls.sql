-- Fix restaurant RLS policies to use auth.uid() IS NOT NULL
-- auth.role() = 'authenticated' is unreliable in newer Supabase versions

DROP POLICY IF EXISTS "restaurants_insert_authenticated" ON public.restaurants;
DROP POLICY IF EXISTS "restaurants_update_authenticated" ON public.restaurants;

CREATE POLICY "restaurants_insert_authenticated" ON public.restaurants
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "restaurants_update_authenticated" ON public.restaurants
  FOR UPDATE USING (auth.uid() IS NOT NULL);
