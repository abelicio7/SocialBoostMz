import { Facebook, Instagram, Youtube, Twitter, Music2 } from "lucide-react";
import { Link } from "react-router-dom";

const services = [
  {
    name: "Facebook",
    icon: Facebook,
    description: "Seguidores para páginas, curtidas e reações",
    color: "from-blue-500 to-blue-600",
    price: "Desde 100 MZN",
  },
  {
    name: "Instagram",
    icon: Instagram,
    description: "Curtidas, respostagens, alcance e impressões",
    color: "from-pink-500 to-purple-600",
    price: "Desde 145 MZN",
  },
  {
    name: "TikTok",
    icon: Music2,
    description: "Seguidores, visualizações e curtidas",
    color: "from-gray-800 to-gray-900",
    price: "Desde 100 MZN",
  },
  {
    name: "YouTube",
    icon: Youtube,
    description: "Visualizações (máx 10k por dia)",
    color: "from-red-500 to-red-600",
    price: "250 MZN por 1000",
  },
  {
    name: "Twitter / X",
    icon: Twitter,
    description: "Seguidores, curtidas, visualizações e retweets",
    color: "from-gray-700 to-gray-800",
    price: "Desde 120 MZN",
  },
];

const ServicesSection = () => {
  return (
    <section className="py-20 md:py-32 bg-background">
      <div className="container px-4">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Nossos Serviços
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            Todas as Redes Sociais
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Oferecemos serviços de crescimento para as principais plataformas sociais. 
            Escolha a rede e comece a crescer hoje.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <Link
              to="/servicos"
              key={service.name}
              className="group relative p-6 rounded-2xl glass-card premium-border hover:scale-[1.02] transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <service.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-display text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                {service.name}
              </h3>
              <p className="text-muted-foreground mb-4">
                {service.description}
              </p>
              <p className="text-primary font-semibold">
                {service.price}
              </p>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
