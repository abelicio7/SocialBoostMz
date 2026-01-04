import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ScrollArea } from "@/components/ui/scroll-area";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            Termos de Uso
          </h1>
          <p className="text-muted-foreground mb-8">
            Última atualização: Janeiro de 2025
          </p>

          <div className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                1. Aceitação dos Termos
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Ao aceder e utilizar os serviços da SocialBoostMz, você concorda integralmente com estes 
                Termos de Uso. Se não concordar com qualquer parte destes termos, não deverá utilizar 
                os nossos serviços. A utilização continuada do nosso site constitui aceitação de 
                quaisquer alterações aos termos.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                2. Descrição dos Serviços
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                A SocialBoostMz oferece serviços de crescimento e engagement para redes sociais, 
                incluindo, mas não se limitando a:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Seguidores para Instagram, TikTok, YouTube e outras plataformas</li>
                <li>Likes, comentários e visualizações</li>
                <li>Engagement e interacções autênticas</li>
                <li>Promoção de conteúdo e alcance orgânico</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                3. Aviso de Risco
              </h2>
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-4">
                <p className="text-warning font-medium mb-2">⚠️ Importante</p>
                <p className="text-muted-foreground leading-relaxed">
                  Todos os serviços de crescimento em redes sociais podem sofrer uma queda natural 
                  de até 10% após a entrega. Isto é normal e deve-se às políticas das plataformas 
                  de redes sociais. A SocialBoostMz não pode ser responsabilizada por quedas 
                  resultantes de acções das plataformas.
                </p>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                O cliente reconhece e aceita que a utilização de serviços de crescimento pode, 
                em casos raros, resultar em acções por parte das plataformas de redes sociais, 
                incluindo avisos ou restrições de conta.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                4. Sistema de Wallet e Pagamentos
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                O nosso sistema funciona através de uma wallet (carteira digital):
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>O saldo carregado na wallet <strong className="text-foreground">não é reembolsável</strong></li>
                <li>O saldo <strong className="text-foreground">não pode ser levantado</strong> em dinheiro</li>
                <li>Os pagamentos são processados através de M-Pesa e E-Mola</li>
                <li>O saldo deve ser utilizado apenas para aquisição de serviços na plataforma</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                5. Política de Reembolso
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Reembolsos só são processados nas seguintes condições:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Quando um pedido não pode ser atendido pela nossa parte</li>
                <li>Quando há falha técnica comprovada do nosso sistema</li>
                <li>O valor é devolvido ao saldo da wallet, nunca em dinheiro</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                A garantia de refill (reposição) é oferecida gratuitamente até 48 horas após a 
                conclusão do pedido, mediante apresentação de comprovativo.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                6. Responsabilidades do Cliente
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                O cliente é responsável por:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Fornecer links correctos e válidos para os serviços solicitados</li>
                <li>Garantir que a conta/página está pública durante todo o período de entrega</li>
                <li>Não alterar a privacidade da conta durante o processamento do pedido</li>
                <li>Verificar os detalhes do pedido antes de confirmar a compra</li>
                <li>Manter as credenciais de acesso à conta em segurança</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                7. Tempo de Entrega
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Os tempos de entrega estimados são indicativos e podem variar dependendo da 
                demanda, capacidade do sistema e factores externos. A SocialBoostMz esforça-se 
                por entregar todos os pedidos dentro do prazo estimado, mas não garante 
                tempos exactos de entrega.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                8. Uso Aceitável
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                É proibido utilizar os nossos serviços para:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Promover conteúdo ilegal, ofensivo ou que viole direitos de terceiros</li>
                <li>Spam, phishing ou actividades fraudulentas</li>
                <li>Revenda dos serviços sem autorização prévia</li>
                <li>Qualquer actividade que viole os termos das plataformas de redes sociais</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                9. Limitação de Responsabilidade
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                A SocialBoostMz não se responsabiliza por danos directos, indirectos, 
                incidentais ou consequentes resultantes do uso ou incapacidade de uso 
                dos nossos serviços. A nossa responsabilidade máxima limita-se ao valor 
                pago pelo serviço específico em questão.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                10. Modificações dos Termos
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                A SocialBoostMz reserva-se o direito de modificar estes termos a qualquer 
                momento. As alterações entram em vigor imediatamente após a publicação no 
                site. O uso continuado dos serviços após as alterações constitui aceitação 
                dos novos termos.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                11. Contacto
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Para questões relacionadas com estes Termos de Uso, entre em contacto connosco 
                através do chat de suporte disponível no painel de controlo ou através do 
                nosso email de suporte.
              </p>
            </section>

            <section className="pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Ao criar uma conta e utilizar os serviços da SocialBoostMz, você confirma que 
                leu, compreendeu e aceita estes Termos de Uso na sua totalidade.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Terms;
