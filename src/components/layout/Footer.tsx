import { Link } from "react-router-dom";
import { Zap, Facebook, Instagram, MessageCircle } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold">
                Social<span className="text-primary">Boost</span>Mz
              </span>
            </Link>
            <p className="text-muted-foreground text-sm mb-4">
              A plataforma líder em serviços de crescimento para redes sociais em Moçambique.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors">
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display font-semibold mb-4">Serviços</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/servicos" className="hover:text-primary transition-colors">Facebook</Link></li>
              <li><Link to="/servicos" className="hover:text-primary transition-colors">Instagram</Link></li>
              <li><Link to="/servicos" className="hover:text-primary transition-colors">TikTok</Link></li>
              <li><Link to="/servicos" className="hover:text-primary transition-colors">YouTube</Link></li>
              <li><Link to="/servicos" className="hover:text-primary transition-colors">Twitter / X</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4">Suporte</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/faq" className="hover:text-primary transition-colors">Perguntas Frequentes</Link></li>
              <li><Link to="/dashboard" className="hover:text-primary transition-colors">Suporte Chat</Link></li>
              <li><Link to="/termos" className="hover:text-primary transition-colors">Termos de Uso</Link></li>
              <li><Link to="/privacidade" className="hover:text-primary transition-colors">Política de Privacidade</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4">Pagamentos</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success" />
                M-Pesa Moçambique
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success" />
                E-Mola
              </li>
            </ul>
            <p className="text-xs text-muted-foreground mt-4">
              Saldo confirmado automaticamente após pagamento.
            </p>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} SocialBoostMz. Todos os direitos reservados.
          </p>
          <p className="text-xs text-muted-foreground">
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
