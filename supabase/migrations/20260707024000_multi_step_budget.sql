-- Add Multi-Step Approval Workflows to Budget Requests
ALTER TABLE budget_requests
ADD COLUMN secondary_status TEXT CHECK (secondary_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN secondary_approved_by UUID REFERENCES profiles(id),
ADD COLUMN secondary_approved_at TIMESTAMP WITH TIME ZONE;
