function LegalLayout({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="pt-12 pb-24 container mx-auto px-4 max-w-3xl">
      <h1 className="text-4xl font-display font-bold text-foreground mb-8">{title}</h1>
      <div className="prose dark:prose-invert prose-lg">
        {children}
      </div>
    </div>
  );
}

export function Privacy() {
  return (
    <LegalLayout title="Privacy Policy">
      <p className="text-muted-foreground">At AJ Insta Heal, we prioritize your privacy. Any personal information you provide when booking appointments or contacting us is used solely to manage your appointments and communicate with you. We do not share or sell your information to third parties.</p>
    </LegalLayout>
  );
}

export function Terms() {
  return (
    <LegalLayout title="Terms of Service">
      <p className="text-muted-foreground">Welcome to AJ Insta Heal. By using our services, you agree to the following terms. Our services are provided in good faith for wellness and healing purposes. We reserve the right to cancel or reschedule appointments where necessary, and will notify you promptly if this occurs.</p>
    </LegalLayout>
  );
}

export function Disclaimer() {
  return (
    <LegalLayout title="Medical Disclaimer">
      <div className="bg-destructive/10 border border-destructive/30 p-4 rounded-lg mb-4">
        <p className="text-destructive font-medium">
          The services provided by AJ Insta Heal are complementary healing practices and are not intended to replace professional medical advice, diagnosis, or treatment.
        </p>
      </div>
      <p className="text-muted-foreground">
        Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
      </p>
    </LegalLayout>
  );
}
