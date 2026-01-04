import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            Política de Privacidade
          </h1>
          <p className="text-muted-foreground mb-8">
            Última atualização: Janeiro de 2025
          </p>

          <div className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                1. Introdução
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                A SocialBoostMz está comprometida em proteger a sua privacidade. Esta Política 
                de Privacidade explica como recolhemos, usamos, armazenamos e protegemos as suas 
                informações pessoais quando utiliza os nossos serviços.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                2. Informações que Recolhemos
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Recolhemos os seguintes tipos de informações:
              </p>
              
              <h3 className="font-display text-lg font-medium text-foreground mb-2 mt-6">
                2.1 Informações de Registo
              </h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Nome completo</li>
                <li>Endereço de email</li>
                <li>Número de telefone</li>
                <li>Credenciais de acesso (password encriptada)</li>
              </ul>

              <h3 className="font-display text-lg font-medium text-foreground mb-2 mt-6">
                2.2 Informações de Transacção
              </h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Histórico de pedidos e serviços adquiridos</li>
                <li>Histórico de pagamentos e recargas</li>
                <li>Saldo da wallet</li>
                <li>Referências de pagamento (M-Pesa, E-Mola)</li>
              </ul>

              <h3 className="font-display text-lg font-medium text-foreground mb-2 mt-6">
                2.3 Informações de Uso
              </h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Links de redes sociais fornecidos para os serviços</li>
                <li>Endereço IP e dados de navegação</li>
                <li>Tipo de dispositivo e navegador</li>
                <li>Páginas visitadas e tempo de sessão</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                3. Como Utilizamos as Suas Informações
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Utilizamos as suas informações para:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Processar e entregar os serviços solicitados</li>
                <li>Gerir a sua conta e wallet</li>
                <li>Processar pagamentos e recargas</li>
                <li>Comunicar sobre o estado dos seus pedidos</li>
                <li>Fornecer suporte ao cliente</li>
                <li>Melhorar os nossos serviços e experiência do utilizador</li>
                <li>Prevenir fraudes e actividades suspeitas</li>
                <li>Cumprir obrigações legais</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                4. Partilha de Informações
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Não vendemos, alugamos ou partilhamos as suas informações pessoais com terceiros 
                para fins de marketing. Podemos partilhar informações apenas nas seguintes situações:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>
                  <strong className="text-foreground">Processadores de pagamento:</strong> M-Pesa e E-Mola 
                  para processar as suas transacções financeiras
                </li>
                <li>
                  <strong className="text-foreground">Fornecedores de serviços:</strong> Parceiros técnicos 
                  que nos ajudam a entregar os serviços de crescimento
                </li>
                <li>
                  <strong className="text-foreground">Obrigações legais:</strong> Quando exigido por lei 
                  ou ordem judicial
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                5. Segurança dos Dados
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Implementamos medidas de segurança apropriadas para proteger as suas informações:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Encriptação SSL/TLS para todas as comunicações</li>
                <li>Passwords armazenadas com hash seguro</li>
                <li>Acesso restrito aos dados por pessoal autorizado</li>
                <li>Monitorização regular de segurança</li>
                <li>Backups regulares e seguros</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                6. Retenção de Dados
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Mantemos as suas informações pessoais enquanto a sua conta estiver activa ou 
                conforme necessário para fornecer os nossos serviços. Podemos reter certas 
                informações por períodos mais longos quando exigido por lei ou para fins de 
                arquivo, resolução de disputas ou execução de acordos.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                7. Os Seus Direitos
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Você tem os seguintes direitos sobre os seus dados pessoais:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>
                  <strong className="text-foreground">Acesso:</strong> Solicitar uma cópia dos dados 
                  que temos sobre si
                </li>
                <li>
                  <strong className="text-foreground">Rectificação:</strong> Corrigir dados incorrectos 
                  ou incompletos
                </li>
                <li>
                  <strong className="text-foreground">Eliminação:</strong> Solicitar a eliminação dos 
                  seus dados, sujeito a obrigações legais
                </li>
                <li>
                  <strong className="text-foreground">Portabilidade:</strong> Receber os seus dados num 
                  formato estruturado
                </li>
                <li>
                  <strong className="text-foreground">Oposição:</strong> Opor-se ao processamento dos 
                  seus dados em certas circunstâncias
                </li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Para exercer estes direitos, entre em contacto connosco através do suporte.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                8. Cookies e Tecnologias Semelhantes
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Utilizamos cookies e tecnologias semelhantes para:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Manter a sua sessão activa</li>
                <li>Lembrar as suas preferências</li>
                <li>Analisar o uso do site para melhorias</li>
                <li>Garantir a segurança da plataforma</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Pode configurar o seu navegador para recusar cookies, embora isso possa 
                afectar a funcionalidade do site.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                9. Menores de Idade
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Os nossos serviços não são destinados a menores de 18 anos. Não recolhemos 
                intencionalmente informações de menores. Se tomarmos conhecimento de que 
                recolhemos dados de um menor, tomaremos medidas para eliminar essas informações.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                10. Alterações a Esta Política
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Podemos actualizar esta Política de Privacidade periodicamente. Notificaremos 
                sobre alterações significativas através do email registado ou de um aviso 
                visível no site. A data de "Última atualização" no topo indica quando a 
                política foi revista pela última vez.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                11. Contacto
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Se tiver dúvidas sobre esta Política de Privacidade ou sobre como tratamos 
                os seus dados, entre em contacto connosco através do chat de suporte no 
                painel de controlo.
              </p>
            </section>

            <section className="pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Ao utilizar os serviços da SocialBoostMz, você reconhece que leu e 
                compreendeu esta Política de Privacidade.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;
