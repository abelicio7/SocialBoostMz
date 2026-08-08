import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import { HelpCircle, ArrowRight } from "lucide-react";

const faqs = [
  {
    question: "Como posso carregar o meu saldo?",
    answer: "Pode carregar o saldo da sua carteira de forma 100% segura e automática usando M-Pesa ou E-Mola. Após o pagamento, o saldo é creditado instantaneamente na sua conta para que possa fazer pedidos a qualquer hora.",
  },
  {
    question: "É seguro para a minha conta? Preciso de fornecer a senha?",
    answer: "Sim, os nossos serviços são totalmente seguros. Nós NUNCA solicitamos a sua senha ou dados de acesso. Apenas precisamos do link público do perfil, página ou publicação que deseja impulsionar.",
  },
  {
    question: "O que acontece se houver uma queda de seguidores/likes?",
    answer: "Quedas naturais pequenas (geralmente até 10%) podem ocorrer devido a atualizações periódicas das redes sociais. Para sua tranquilidade, oferecemos uma garantia de reposição gratuita (refill) até 48 horas após a conclusão do pedido.",
  },
  {
    question: "Qual é o tempo estimado para a entrega começar?",
    answer: "A maioria dos serviços inicia a entrega no espaço de 1 a 24 horas após a confirmação do pedido. O tempo estimado detalhado é exibido no simulador de preços e no catálogo de serviços para cada categoria.",
  },
  {
    question: "Posso solicitar reembolso do saldo carregado?",
    answer: "O saldo carregado na carteira digital não é reembolsável para contas externas e não pode ser levantado. Caso ocorra alguma falha na entrega de um pedido, o valor correspondente é devolvido integralmente ao saldo da sua carteira para ser usado em novos pedidos.",
  },
];

const FAQSection = () => {
  return (
    <section className="py-20 md:py-32 bg-background relative overflow-hidden border-t border-border/40">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="container relative z-10 px-4 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Dúvidas Frequentes
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            Perguntas <span className="text-gradient-gold">Frequentes</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Tem alguma dúvida sobre o funcionamento do SocialBoostMz? Encontre as respostas rápidas abaixo.
          </p>
        </div>

        <div className="glass-card premium-border rounded-2xl p-6 md:p-8">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-b border-border/50 last:border-0">
                <AccordionTrigger className="font-display font-semibold text-left text-base md:text-lg py-4 hover:text-primary transition-colors">
                  <span className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm md:text-base leading-relaxed pb-4 pl-8">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            Ainda tem dúvidas? Veja a nossa página de FAQ completa ou fale com o nosso suporte.
          </p>
          <Link to="/faq" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline mt-2">
            Ver todas as perguntas frequentes
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
