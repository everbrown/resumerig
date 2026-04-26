
CREATE TABLE public.abuse_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fingerprint TEXT,
  ip_address TEXT,
  email_domain TEXT,
  signal_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_abuse_signals_fingerprint ON public.abuse_signals (fingerprint, created_at DESC);
CREATE INDEX idx_abuse_signals_ip ON public.abuse_signals (ip_address, created_at DESC);

ALTER TABLE public.abuse_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage abuse signals"
  ON public.abuse_signals
  FOR ALL
  TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Returns 'ok', 'fingerprint_exhausted', or 'ip_rate_limited'
CREATE OR REPLACE FUNCTION public.check_free_trial_abuse(
  p_fingerprint TEXT,
  p_ip TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fp_count INTEGER;
  ip_count INTEGER;
BEGIN
  IF p_fingerprint IS NOT NULL THEN
    SELECT COUNT(*) INTO fp_count
      FROM abuse_signals
      WHERE fingerprint = p_fingerprint
        AND signal_type = 'free_preview';
    IF fp_count >= 3 THEN
      RETURN 'fingerprint_exhausted';
    END IF;
  END IF;

  IF p_ip IS NOT NULL THEN
    SELECT COUNT(*) INTO ip_count
      FROM abuse_signals
      WHERE ip_address = p_ip
        AND signal_type = 'free_preview'
        AND created_at > now() - INTERVAL '24 hours';
    IF ip_count >= 5 THEN
      RETURN 'ip_rate_limited';
    END IF;
  END IF;

  RETURN 'ok';
END;
$$;
