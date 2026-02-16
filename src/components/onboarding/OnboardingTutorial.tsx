import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  ShoppingCart,
  Link as LinkIcon,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  MousePointerClick,
  CreditCard,
  Package,
} from "lucide-react";

const TUTORIAL_KEY = "onboarding_tutorial_seen";

const steps = [
  {
    icon: Sparkles,
    title: "Bem-vindo à Plataforma! 🎉",
    description:
      "Vamos mostrar-te como fazer o teu primeiro pedido em poucos passos simples.",
    details: [
      "É rápido e fácil!",
      "Siga os próximos passos para começar",
    ],
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: CreditCard,
    title: "1. Recarregue a Carteira",
    description:
      'Clique no botão "Recarregar" no painel principal para adicionar saldo à sua conta.',
    details: [
      'Vá ao separador "Carteira"',
      'Clique em "Recarregar Carteira"',
      "Insira o valor e faça o pagamento",
      "O saldo aparecerá automaticamente",
    ],
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    icon: ShoppingCart,
    title: "2. Crie um Novo Pedido",
    description:
      'No menu lateral, clique em "Novo Pedido" ou no botão "+" para abrir o formulário.',
    details: [
      'Acesse o separador "Pedidos"',
      'Clique em "Novo Pedido"',
      "O formulário de pedido irá abrir",
    ],
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: MousePointerClick,
    title: "3. Escolha o Serviço",
    description:
      "Selecione a rede social e o tipo de serviço que pretende (seguidores, likes, visualizações, etc.).",
    details: [
      "Escolha a plataforma (Instagram, TikTok, etc.)",
      "Selecione o serviço desejado",
      "Veja o preço por quantidade",
    ],
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    icon: LinkIcon,
    title: "4. Insira o Link e Quantidade",
    description:
      "Cole o link do seu perfil ou publicação e defina a quantidade desejada.",
    details: [
      "Cole o link correto da rede social",
      "Defina a quantidade (mín. 100)",
      "O preço total será calculado automaticamente",
    ],
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Package,
    title: "5. Confirme e Acompanhe",
    description:
      'Revise o pedido, confirme e acompanhe o estado no separador "Pedidos".',
    details: [
      'Clique em "Criar Pedido" para confirmar',
      "O valor será debitado da sua carteira",
      'Acompanhe o estado em "Meus Pedidos"',
      "Receberá o serviço no prazo estimado",
    ],
    color: "text-accent",
    bg: "bg-accent/10",
  },
];

export function useShowOnboarding() {
  const seen = localStorage.getItem(TUTORIAL_KEY);
  return !seen;
}

export function markOnboardingSeen() {
  localStorage.setItem(TUTORIAL_KEY, "true");
}

export default function OnboardingTutorial({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;
  const Icon = step.icon;

  const handleClose = () => {
    markOnboardingSeen();
    setCurrentStep(0);
    onClose();
  };

  const handleNext = () => {
    if (isLast) {
      handleClose();
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden border-border/50">
        {/* Progress bar */}
        <div className="flex gap-1 px-4 pt-4">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                i <= currentStep ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Icon */}
          <div className={`w-16 h-16 rounded-2xl ${step.bg} flex items-center justify-center mx-auto`}>
            <Icon className={`w-8 h-8 ${step.color}`} />
          </div>

          {/* Title & Description */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
            <p className="text-sm text-muted-foreground">{step.description}</p>
          </div>

          {/* Details */}
          <div className="space-y-2">
            {step.details.map((detail, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/50"
              >
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-foreground/80">{detail}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border/50 bg-muted/30">
          <div className="flex gap-2">
            {!isFirst && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentStep((s) => s - 1)}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Voltar
              </Button>
            )}
            {isFirst && (
              <Button variant="ghost" size="sm" onClick={handleClose}>
                Pular
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {currentStep + 1}/{steps.length}
            </span>
            <Button size="sm" onClick={handleNext}>
              {isLast ? (
                "Começar!"
              ) : (
                <>
                  Próximo
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
