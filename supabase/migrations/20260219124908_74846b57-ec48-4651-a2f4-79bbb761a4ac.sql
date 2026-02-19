
CREATE TABLE public.stock_news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker TEXT,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  source TEXT,
  sentiment TEXT DEFAULT 'neutro',
  published_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stock news are publicly readable"
ON public.stock_news
FOR SELECT
USING (true);
