const stats = [
  { value: "50K+", label: "Clientes Satisfeitos" },
  { value: "500K+", label: "Pedidos Completos" },
  { value: "99.9%", label: "Taxa de Sucesso" },
  { value: "24/7", label: "Suporte Activo" },
];

const StatsSection = () => {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-r from-primary/10 via-background to-accent/10">
      <div className="container px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="text-center animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="font-display text-4xl md:text-5xl font-bold text-gradient-gold mb-2">
                {stat.value}
              </div>
              <p className="text-muted-foreground font-medium">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
