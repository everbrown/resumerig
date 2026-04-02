import { Sparkles } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-secondary" />
            <span className="font-display text-lg font-bold text-foreground">
              Resume<span className="text-secondary">Rig</span>
            </span>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <a href="/contact" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </a>
            <a href="/privacy" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </a>
            <a href="/terms" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </a>
          </nav>
        </div>

        {/* Bottom */}
        <div className="mt-6 border-t border-border pt-6 text-center">
          <p className="font-body text-xs text-muted-foreground">
            © {new Date().getFullYear()} ResumeRig. All rights reserved. · Powered by AI · Secure payments by Stripe
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
