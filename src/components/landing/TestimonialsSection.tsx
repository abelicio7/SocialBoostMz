import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    name: "Edson Mandlate",
    role: "Criador de Conteúdo",
    location: "Maputo",
    avatar: "/testimonial-edson.jpg",
    initials: "EM",
    rating: 5,
    text: "O SocialBoostMz mudou as minhas redes. O aumento de visualizações no TikTok ajudou-me a fechar os meus primeiros patrocínios em Maputo. Altamente recomendado!",
  },
  {
    name: "Sónia Mariza",
    role: "Dona de Loja Online",
    location: "Beira",
    avatar: "/testimonial-sonia.jpg",
    initials: "SM",
    rating: 5,
    text: "Uso a plataforma para impulsionar a página de Instagram da minha boutique. O sistema de carregamento via M-Pesa é super rápido e os seguidores chegam sem falhas.",
  },
  {
    name: "Júlio Cossa",
    role: "Empreendedor Digital",
    location: "Nampula",
    avatar: "/testimonial-julio.jpg",
    initials: "JC",
    rating: 5,
    text: "Excelente serviço de suporte! Tive uma pequena queda de seguidores e eles fizeram a reposição gratuita em menos de 24 horas usando a garantia refill. Nota 10!",
  },
];

const TestimonialsSection = () => {
  return (
    <section className="py-20 md:py-32 bg-card/10 relative overflow-hidden border-t border-border/40">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-[100px]" />
      </div>

      <div className="container relative z-10 px-4">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            Depoimentos
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            O Que Dizem os Nossos <span className="text-gradient-gold">Clientes</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Descubra como ajudamos influenciadores, marcas e negócios em Moçambique a alcançarem o próximo nível.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((t, index) => (
            <Card
              key={t.name}
              className="glass-card premium-border relative p-6 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <CardContent className="p-0 space-y-4">
                {/* Stars */}
                <div className="flex gap-1">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>

                {/* Text */}
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed italic">
                  "{t.text}"
                </p>

                {/* User Info */}
                <div className="flex items-center gap-3 pt-4 border-t border-border/30">
                  <Avatar className="w-10 h-10 border border-primary/20">
                    <AvatarImage src={t.avatar} alt={t.name} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                      {t.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-display font-bold text-sm text-foreground">
                      {t.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {t.role} • <span className="text-primary">{t.location}</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
