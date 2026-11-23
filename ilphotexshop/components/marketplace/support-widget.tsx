"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  MessageCircle,
  MessageSquareText,
  ShoppingBag,
  Send,
  X,
} from "lucide-react";
import { useState, type FormEvent } from "react";

type SupportLanguage = "en" | "fr" | "rw";
type SupportCategory =
  | "Order"
  | "Payment"
  | "Product"
  | "Merchant"
  | "Account"
  | "General";

type SupportWidgetProps = {
  language?: SupportLanguage;
  openByDefault?: boolean;
  cartCount?: number;
  onOpenCart?: () => void;
};

const copy = {
  en: {
    open: "Ask for support",
    title: "How can we help?",
    subtitle: "Answer a few quick questions.",
    chooseLanguage: "Choose your language",
    chooseCategory: "What do you need help with?",
    chooseContact: "How can support reach you?",
    askQuestion: "Tell us what you need",
    name: "Full name",
    email: "Email address",
    phone: "Phone number",
    contactHint: "Provide either email or phone.",
    subject: "Subject",
    message: "Describe your issue",
    back: "Back",
    continue: "Continue",
    send: "Send request",
    sending: "Sending…",
    success: "Your request was submitted.",
    ticket: "Ticket",
    another: "Ask another question",
  },
  fr: {
    open: "Demander de l'aide",
    title: "Comment pouvons-nous aider?",
    subtitle: "Répondez à quelques questions rapides.",
    chooseLanguage: "Choisissez votre langue",
    chooseCategory: "En quoi avons-nous besoin de vous aider?",
    chooseContact: "Comment pouvons-nous vous joindre?",
    askQuestion: "Expliquez votre besoin",
    name: "Nom complet",
    email: "Adresse e-mail",
    phone: "Numéro de téléphone",
    contactHint: "Indiquez l'e-mail ou le téléphone.",
    subject: "Sujet",
    message: "Décrivez votre problème",
    back: "Retour",
    continue: "Continuer",
    send: "Envoyer",
    sending: "Envoi…",
    success: "Votre demande a été envoyée.",
    ticket: "Ticket",
    another: "Poser une autre question",
  },
  rw: {
    open: "Saba ubufasha",
    title: "Twagufasha dute?",
    subtitle: "Subiza ibibazo bike byihuse.",
    chooseLanguage: "Hitamo ururimi rwawe",
    chooseCategory: "Ukeneye ubufasha ku ki?",
    chooseContact: "Twakubona dute?",
    askQuestion: "Tubwire icyo ukeneye",
    name: "Izina ryuzuye",
    email: "Imeli",
    phone: "Telefoni",
    contactHint: "Shyiramo imeli cyangwa telefoni.",
    subject: "Umutwe",
    message: "Sobanura ikibazo cyawe",
    back: "Subira inyuma",
    continue: "Komeza",
    send: "Ohereza",
    sending: "Ohereza…",
    success: "Ibyo wabasabye byoherejwe.",
    ticket: "Ticket",
    another: "Baza ikindi kibazo",
  },
} as const;

const categories = {
  en: {
    Order: "My order",
    Payment: "Payment",
    Product: "Product",
    Merchant: "Selling / merchant",
    Account: "My account",
    General: "General question",
  },
  fr: {
    Order: "Ma commande",
    Payment: "Paiement",
    Product: "Produit",
    Merchant: "Vente / marchand",
    Account: "Mon compte",
    General: "Question générale",
  },
  rw: {
    Order: "Igihembwe cyanjye",
    Payment: "Ubwishyu",
    Product: "Igicuruzwa",
    Merchant: "Ubucuruzi",
    Account: "Konti yanjye",
    General: "Ikibazo rusange",
  },
} as const;

export default function SupportWidget({
  language: initialLanguage = "en",
  openByDefault = false,
  cartCount = 0,
  onOpenCart,
}: SupportWidgetProps) {
  const [open, setOpen] = useState(openByDefault);
  const [language, setLanguage] = useState<SupportLanguage>(initialLanguage);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [category, setCategory] = useState<SupportCategory | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const text = copy[language];

  function reset() {
    setStep(1);
    setCategory(null);
    setName("");
    setEmail("");
    setPhone("");
    setSubject("");
    setMessage("");
    setError("");
    setReference("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/support-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: email || undefined,
          phone: phone || undefined,
          category,
          subject,
          message,
        }),
      });
      const result = (await response.json().catch(() => null)) as
        | { ticketId?: string; error?: string }
        | null;
      if (!response.ok) {
        throw new Error(result?.error || "Support request could not be sent.");
      }
      setReference(result?.ticketId?.slice(-8).toUpperCase() ?? "");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Support request could not be sent.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="support-widget" aria-live="polite">
      {open && (
        <section
          className="support-widget-panel"
          role="dialog"
          aria-label={text.title}
        >
          <header className="support-widget-header">
            <span className="support-widget-avatar" aria-hidden="true">
              <MessageSquareText size={21} />
            </span>
            <div>
              <strong>{text.title}</strong>
              <small>{text.subtitle}</small>
            </div>
            <button
              aria-label="Close support form"
              onClick={() => setOpen(false)}
              type="button"
            >
              <X size={18} />
            </button>
          </header>

          <div className="support-widget-progress" aria-label={`Step ${step} of 4`}>
            {[1, 2, 3, 4].map((item) => (
              <span className={item <= step ? "is-active" : ""} key={item} />
            ))}
          </div>

          {reference ? (
            <div className="support-widget-success" role="status">
              <span aria-hidden="true"><Check size={28} /></span>
              <strong>{text.success}</strong>
              <small>{text.ticket} #{reference}</small>
              <button
                type="button"
                onClick={() => {
                  reset();
                }}
              >
                {text.another}
              </button>
            </div>
          ) : (
            <>
              {step === 1 && (
                <div className="support-widget-step">
                  <h2>{text.chooseLanguage}</h2>
                  <div className="support-widget-options">
                    <button type="button" onClick={() => setLanguage("en")}>
                      <strong>English</strong>
                      {language === "en" && <Check size={17} />}
                    </button>
                    <button type="button" onClick={() => setLanguage("fr")}>
                      <strong>Français</strong>
                      {language === "fr" && <Check size={17} />}
                    </button>
                    <button type="button" onClick={() => setLanguage("rw")}>
                      <strong>Ikinyarwanda</strong>
                      {language === "rw" && <Check size={17} />}
                    </button>
                  </div>
                  <button
                    className="support-widget-next"
                    type="button"
                    onClick={() => setStep(2)}
                  >
                    {text.continue} <ArrowRight size={16} />
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="support-widget-step">
                  <h2>{text.chooseCategory}</h2>
                  <div className="support-widget-category-grid">
                    {(Object.keys(categories[language]) as SupportCategory[]).map(
                      (key) => (
                        <button
                          aria-pressed={category === key}
                          className={category === key ? "is-selected" : ""}
                          key={key}
                          type="button"
                          onClick={() => setCategory(key)}
                        >
                          {categories[language][key]}
                          {category === key && <Check size={16} />}
                        </button>
                      ),
                    )}
                  </div>
                  <div className="support-widget-actions">
                    <button type="button" onClick={() => setStep(1)}>
                      <ArrowLeft size={16} /> {text.back}
                    </button>
                    <button
                      className="support-widget-next"
                      disabled={!category}
                      type="button"
                      onClick={() => setStep(3)}
                    >
                      {text.continue} <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <form
                  className="support-widget-step support-widget-contact"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!email.trim() && !phone.trim()) {
                      setError(text.contactHint);
                      return;
                    }
                    setError("");
                    setStep(4);
                  }}
                >
                  <h2>{text.chooseContact}</h2>
                  <small>{text.contactHint}</small>
                  <label>
                    {text.name}
                    <input
                      maxLength={100}
                      minLength={2}
                      onChange={(event) => setName(event.target.value)}
                      required
                      value={name}
                    />
                  </label>
                  <label>
                    {text.email}
                    <input
                      maxLength={254}
                      onChange={(event) => setEmail(event.target.value)}
                      type="email"
                      value={email}
                    />
                  </label>
                  <label>
                    {text.phone}
                    <input
                      maxLength={32}
                      onChange={(event) => setPhone(event.target.value)}
                      value={phone}
                    />
                  </label>
                  {error && <p role="alert">{error}</p>}
                  <div className="support-widget-actions">
                    <button type="button" onClick={() => setStep(2)}>
                      <ArrowLeft size={16} /> {text.back}
                    </button>
                    <button className="support-widget-next" type="submit">
                      {text.continue} <ArrowRight size={16} />
                    </button>
                  </div>
                </form>
              )}

              {step === 4 && (
                <form className="support-widget-step" onSubmit={submit}>
                  <h2>{text.askQuestion}</h2>
                  <label>
                    {text.subject}
                    <input
                      maxLength={200}
                      minLength={3}
                      onChange={(event) => setSubject(event.target.value)}
                      required
                      value={subject}
                    />
                  </label>
                  <label>
                    {text.message}
                    <textarea
                      maxLength={4000}
                      minLength={3}
                      onChange={(event) => setMessage(event.target.value)}
                      required
                      rows={5}
                      value={message}
                    />
                  </label>
                  {error && <p role="alert">{error}</p>}
                  <div className="support-widget-actions">
                    <button type="button" onClick={() => setStep(3)}>
                      <ArrowLeft size={16} /> {text.back}
                    </button>
                    <button
                      className="support-widget-next"
                      disabled={busy}
                      type="submit"
                    >
                      <Send size={16} />
                      {busy ? text.sending : text.send}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </section>
      )}
      <div className="support-widget-floating-actions">
        {onOpenCart && (
          <button
            aria-label={`Open cart, ${cartCount} items`}
            className="support-widget-cart"
            onClick={() => window.location.assign("/checkout")}
            title="Open cart"
            type="button"
          >
            <ShoppingBag size={21} />
            {cartCount > 0 && (
              <span aria-label={`${cartCount} items in cart`}>
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </button>
        )}
        <a
          aria-label="Chat with us on WhatsApp"
          className="support-widget-whatsapp"
          href="https://wa.me/250736494012"
          rel="noopener noreferrer"
          target="_blank"
          title="Chat on WhatsApp"
        >
          <MessageCircle size={27} />
        </a>
        <button
          aria-expanded={open}
          aria-label={open ? "Close support chat" : text.open}
          className="support-widget-trigger"
          onClick={() => setOpen((current) => !current)}
          title={text.open}
          type="button"
        >
          {open ? <X size={24} /> : <MessageSquareText size={25} />}
        </button>
      </div>
    </div>
  );
}
