// Reusable component for legal pages
function LegalLayout({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="pt-12 pb-24 container mx-auto px-4 max-w-3xl">
      <h1 className="text-4xl font-display font-bold text-white mb-8">{title}</h1>
      <div className="prose prose-invert prose-lg">
        {children}
      </div>
    </div>
  );
}

export function Privacy() {
  return (
    <LegalLayout title="Privacy Policy">
      <p>At AJ Insta Heal, we prioritize your privacy...</p>
      {/* Placeholder content */}
    </LegalLayout>
  );
}

export function Terms() {
  return (
    <LegalLayout title="Terms of Service">
      <p>Welcome to AJ Insta Heal. By using our services...</p>
    </LegalLayout>
  );
}

export function Disclaimer() {
  return (
    <LegalLayout title="Medical Disclaimer">
      <p className="text-red-300 border border-red-900/50 bg-red-900/10 p-4 rounded-lg">
        The services provided by AJ Insta Heal are complementary healing practices and are not intended to replace professional medical advice, diagnosis, or treatment.
      </p>
      <p className="mt-4">
        Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
      </p>
    </LegalLayout>
  );
}
