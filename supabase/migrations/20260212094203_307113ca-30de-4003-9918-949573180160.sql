
-- Update the handle_new_user function to give 50 credit to new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, balance)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', 50.00);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  -- Record the welcome bonus transaction
  INSERT INTO public.wallet_transactions (user_id, amount, type, description)
  VALUES (NEW.id, 50.00, 'deposit', 'Bónus de boas-vindas');
  
  RETURN NEW;
END;
$function$;
