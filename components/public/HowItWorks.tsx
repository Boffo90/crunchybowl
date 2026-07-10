const steps = [
  { title: "Elige tus productos", desc: "Explora la carta y arma tu pedido" },
  { title: "Retiro o delivery", desc: "Escoge cómo lo quieres recibir" },
  { title: "Paga seguro", desc: "Flow.cl o pago al recibir" },
  { title: "Preparamos tu pedido", desc: "Cocinamos al momento" },
  { title: "Disfruta", desc: "Retira o recibe tu pedido" },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <h2 className="mb-12 text-center font-display text-4xl font-bold text-crunchy-dark">Cómo funciona</h2>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-5">
        {steps.map((s, i) => (
          <div key={i} className="text-center">
            <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-crunchy-pink-soft text-2xl font-bold text-crunchy-accent shadow-kawaii">
              {i + 1}
            </div>
            <h3 className="mb-1 font-semibold text-crunchy-dark">{s.title}</h3>
            <p className="text-sm text-crunchy-muted">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
