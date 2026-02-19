
-- Table to cache stock quotes from Brapi
CREATE TABLE public.stock_quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker TEXT NOT NULL UNIQUE,
  name TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  change_percent NUMERIC NOT NULL DEFAULT 0,
  market_cap NUMERIC,
  volume NUMERIC,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Allow public read access (no auth needed for stock data)
ALTER TABLE public.stock_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stock quotes are publicly readable"
ON public.stock_quotes
FOR SELECT
USING (true);
