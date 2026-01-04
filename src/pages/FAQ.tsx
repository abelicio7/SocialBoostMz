import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Como funciona o SocialBoostMz?",
    answer: "O SocialBoostMz é uma plataforma onde pode comprar serviços de crescimento para redes sociais. Basta criar uma conta, carregar saldo via M-Pesa ou E-Mola, escolher o serviço desejado e fazer o pedido. O processo é automático e seguro.",
  },
  {
    question: "Quais métodos de pagamento aceitam?",
    answer: "Actualmente aceitamos M-Pesa (Vodacom) e E-Mola (Movitel). Após efectuar o pagamento, o saldo é creditado automaticamente na sua conta. Estamos a trabalhar para adicionar mais opções em breve.",
  },
  {
    question: "O saldo carregado expira?",
    answer: "Não, o saldo carregado na sua wallet nunca expira. Pode utilizá-lo quando quiser. No entanto, o saldo não é reembolsável e não pode ser levantado - apenas pode ser usado para comprar serviços na plataforma.",
  },
  {
    question: "Quanto tempo demora a entrega?",
    answer: "O tempo de entrega varia consoante o serviço. A maioria dos pedidos inicia entre 1-24 horas após a confirmação. Cada serviço indica o tempo estimado de entrega na descrição.",
  },
  {
    question: "Existe risco de queda nos números?",
    answer: "Sim, pode ocorrer uma queda natural de até 10% após a entrega. Isto é normal e deve-se às políticas das plataformas sociais. Oferecemos garantia de refill (reposição) até 48 horas após a conclusão do pedido, mediante apresentação de comprovativo.",
  },
  {
    question: "Como solicito refill?",
    answer: "Para solicitar refill, aceda ao chat de suporte no seu dashboard, envie o ID do pedido e um screenshot mostrando a queda. A nossa equipa processará o refill dentro de 24-48 horas.",
  },
  {
    question: "Posso pedir reembolso?",
    answer: "Reembolsos só são processados quando um pedido não pode ser atendido pela nossa parte. Neste caso, o valor é devolvido ao saldo da wallet. Não fazemos reembolsos por arrependimento ou por quedas dentro do limite esperado (até 10%).",
  },
  {
    question: "Qual é o pedido mínimo e máximo?",
    answer: "O pedido mínimo é de 100 unidades e o máximo é de 100.000 unidades por pedido. Existe também um limite diário por utilizador de 200.000 unidades.",
  },
  {
    question: "A minha conta pode ser banida?",
    answer: "Os nossos serviços são seguros, mas recomendamos não exagerar. Faça crescimentos graduais e mantenha a sua conta activa. Não nos responsabilizamos por acções das plataformas sobre a sua conta.",
  },
  {
    question: "Os seguidores/gostos são reais?",
    answer: "Oferecemos diferentes tipos de serviços com diferentes níveis de qualidade. Alguns são de alta qualidade com contas activas, outros são mais económicos. Consulte a descrição de cada serviço para mais detalhes.",
  },
];

const FAQ = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-20">
        <div className="container px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Perguntas Frequentes
            </span>
            <h1 className="font-display text-3xl md:text-5xl font-bold mb-4">
              Como Podemos Ajudar?
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Encontre respostas às perguntas mais comuns sobre os nossos serviços.
            </p>
          </div>

          {/* FAQ Accordion */}
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="rounded-2xl glass-card border border-border px-6 data-[state=open]:border-primary/30"
                >
                  <AccordionTrigger className="text-left font-display font-semibold hover:text-primary py-6">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-6">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Contact CTA */}
          <div className="text-center mt-16">
            <p className="text-muted-foreground mb-4">
              Não encontrou a sua resposta?
            </p>
            <p className="text-foreground">
              Entre em contacto connosco através do{" "}
              <a href="/dashboard" className="text-primary font-medium hover:underline">
                chat de suporte
              </a>{" "}
              no seu dashboard.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FAQ;
