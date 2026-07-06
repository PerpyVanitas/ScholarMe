-- Enable Row Level Security on the roles table to fix Security Advisor critical warnings
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
