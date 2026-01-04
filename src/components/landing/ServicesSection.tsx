import { Facebook, Instagram, Youtube, Twitter, Music2, Users } from "lucide-react";
import { Link } from "react-router-dom";

const services = [
  {
    name: "Facebook",
    icon: Facebook,
    description: "Seguidores, gostos, comentários e partilhas",
    color: "from-blue-500 to-blue-600",
    price: "Desde 50 MZN",
  },
  {
    name: "Instagram",
    icon: Instagram,
    description: "Seguidores, gostos, views e reels",
    color: "from-pink-500 to-purple-600",
    price: "Desde 75 MZN",
  },
  {
    name: "TikTok",
    icon: Music2,
    description: "Seguidores, gostos, visualizações e partilhas",
    color: "from-gray-800 to-gray-900",
    price: "Desde 60 MZN",
  },
  {
    name: "YouTube",
    icon: Youtube,
    description: "Subscritores, views, gostos e comentários",
    color: "from-red-500 to-red-600",
    price: "Desde 100 MZN",
  },
  {
    name: "Twitter / X",
    icon: Twitter,
    description: "Seguidores, retweets, gostos e views",
    color: "from-gray-700 to-gray-800",
    price: "Desde 80 MZN",
  },
  {
    name: "Outros",
    icon: Users,
    description: "Telegram, LinkedIn, Spotify e mais",
    color: "from-accent to-blue-600",
    price: "Consulte-nos",
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
