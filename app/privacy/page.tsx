import React from "react";

export default function PrivacyNotice() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6 prose dark:prose-invert">
      <h1>Data Privacy Notice</h1>
      <p>Last Updated: July 2026</p>
      
      <h2>1. Introduction</h2>
      <p>ScholarMe respects your privacy and is committed to protecting your personal data in compliance with the Philippine Data Privacy Act of 2012 (RA 10173).</p>

      <h2>2. Data We Collect</h2>
      <ul>
        <li><strong>Identity Data:</strong> Name, Email, Date of Birth, Student Number.</li>
        <li><strong>Academic Data:</strong> Degree Program, Year Level, Scholarship Status.</li>
        <li><strong>Operational Data:</strong> Timesheets, Chat Logs, Financial Requests, and Uploaded Documents.</li>
      </ul>

      <h2>3. How We Use Your Data</h2>
      <p>Your data is used strictly for organizational operations, peer tutoring management, and internal record-keeping. We do not sell or share your data with third parties outside of our operational infrastructure (e.g., Vercel, Supabase) which are bound by strict security agreements.</p>

      <h2>4. Data Retention & Right to Erasure</h2>
      <p>You have the right to request the deletion of your account. Upon account deletion, all personal identifiers are wiped. Financial records and operational logs are anonymized but retained for organizational audit purposes as required by our constitution.</p>

      <h2>5. Contact Us</h2>
      <p>If you have any questions about this Privacy Notice, please contact the Data Protection Officer or the President of the organization.</p>
    </div>
  );
}
