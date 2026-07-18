-- 1. Trigger para impedir utilizadores comuns de atualizarem o seu próprio saldo diretamente
CREATE OR REPLACE FUNCTION public.prevent_user_balance_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (OLD.balance IS DISTINCT FROM NEW.balance) THEN
    -- Bloquear se for utilizador comum autenticado (não admin)
    IF (auth.role() = 'authenticated') AND NOT (public.has_role(auth.uid(), 'admin')) THEN
      RAISE EXCEPTION 'Não tem permissão para alterar o seu próprio saldo diretamente.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_user_balance_update ON public.profiles;

CREATE TRIGGER trg_prevent_user_balance_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_user_balance_update();

-- 2. Função segura para criação de pedidos (SECURITY DEFINER ignora RLS e corre com privilégios de admin/system)
CREATE OR REPLACE FUNCTION public.place_order_secure(
  p_service_id UUID,
  p_link TEXT,
  p_quantity INTEGER
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_balance DECIMAL(12,2);
  v_is_blocked BOOLEAN;
  v_price_per_1000 DECIMAL(10,2);
  v_min_quantity INTEGER;
  v_max_quantity INTEGER;
  v_is_active BOOLEAN;
  v_total_price DECIMAL(10,2);
  v_order public.orders;
  v_is_on_break BOOLEAN;
  v_service_name TEXT;
BEGIN
  -- Obter utilizador autenticado
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilizador não autenticado.';
  END IF;

  -- Validar se a plataforma está em intervalo
  SELECT is_on_break INTO v_is_on_break FROM public.platform_settings LIMIT 1;
  IF v_is_on_break = true THEN
    RAISE EXCEPTION 'A plataforma está em intervalo neste momento.';
  END IF;

  -- Obter dados do perfil do utilizador
  SELECT balance, is_blocked INTO v_balance, v_is_blocked
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_is_blocked = true THEN
    RAISE EXCEPTION 'A sua conta está bloqueada e não pode criar pedidos.';
  END IF;

  -- Obter detalhes do serviço
  SELECT name, price_per_1000, min_quantity, max_quantity, is_active
  INTO v_service_name, v_price_per_1000, v_min_quantity, v_max_quantity, v_is_active
  FROM public.services
  WHERE id = p_service_id;

  IF v_is_active = false OR v_price_per_1000 IS NULL THEN
    RAISE EXCEPTION 'Este serviço está inativo ou não existe.';
  END IF;

  -- Validar quantidade mínima e máxima
  IF p_quantity < v_min_quantity OR p_quantity > v_max_quantity THEN
    RAISE EXCEPTION 'Quantidade fora dos limites permitidos do serviço.';
  END IF;

  -- Calcular preço total
  v_total_price := (p_quantity::DECIMAL / 1000.0) * v_price_per_1000;

  -- Validar se tem saldo suficiente
  IF v_balance < v_total_price THEN
    RAISE EXCEPTION 'Saldo insuficiente para realizar este pedido.';
  END IF;

  -- Debitar saldo do perfil do utilizador
  UPDATE public.profiles
  SET balance = balance - v_total_price
  WHERE id = v_user_id;

  -- Criar o pedido
  INSERT INTO public.orders (user_id, service_id, quantity, link, total_price, status)
  VALUES (v_user_id, p_service_id, p_quantity, p_link, v_total_price, 'pending')
  RETURNING * INTO v_order;

  -- Registar transação financeira
  INSERT INTO public.wallet_transactions (user_id, amount, type, description, order_id)
  VALUES (
    v_user_id,
    -v_total_price,
    'order_payment',
    'Pagamento pedido #' || substring(v_order.id::text from 1 for 8) || ' - ' || v_service_name,
    v_order.id
  );

  RETURN v_order;
END;
$$;
