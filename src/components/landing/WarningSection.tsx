import { AlertTriangle, Info } from "lucide-react";

const WarningSection = () => {
  return (
    <section className="py-16 bg-background">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto">
          <div className="p-6 md:p-8 rounded-2xl bg-warning/5 border border-warning/20">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-warning" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-warning mb-3">
                  Aviso Importante
                </h3>
                <div className="space-y-3 text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Queda possível:</strong> Todos os serviços de crescimento em redes sociais podem 
                    sofrer uma queda natural de até 10% após a entrega. Isto é normal e deve-se às políticas das plataformas.
                  </p>
                  <p>
                    <strong className="text-foreground">Garantia de refill:</strong> Oferecemos reposição gratuita até 48 horas após 
                    a conclusão do pedido, mediante apresentação de comprovativo.
                  </p>
                  <p>
                    <strong className="text-foreground">Responsabilidade:</strong> O cliente é responsável por fornecer links 
                    correctos e garantir que a conta/página está pública durante o serviço.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-6 md:p-8 rounded-2xl bg-accent/5 border border-accent/20">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                <Info className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-accent mb-3">
                  Política de Reembolso
                </h3>
                <div className="space-y-3 text-muted-foreground">
                  <p>
                    O saldo carregado na wallet <strong className="text-foreground">não é reembolsável</strong> e 
                    <strong className="text-foreground"> não pode ser levantado</strong>.
                  </p>
                  <p>
                    Reembolsos só são processados quando um pedido não pode ser atendido pela nossa parte. 
                    Neste caso, o valor é devolvido ao saldo da wallet.
                  </p>
                  <p>
                    Ao criar uma conta, você concorda com os nossos termos de uso e política de reembolso.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WarningSection;
