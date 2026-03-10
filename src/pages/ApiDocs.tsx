import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Code, Key, ShoppingCart, Eye, Wallet, ArrowRight } from "lucide-react";

const ApiDocs = () => {
  const baseUrl = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/reseller-api`;
  const displayBaseUrl = baseUrl;

  const endpoints = [
    {
      method: "GET",
      path: "/services",
      title: "Listar Serviços",
      description: "Retorna todos os serviços activos com os preços já com o seu desconto aplicado.",
      icon: Eye,
      request: null,
      response: `{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Seguidores Facebook",
      "platform": "facebook",
      "description": "...",
      "price_per_1000": 315.00,
      "min_quantity": 100,
      "max_quantity": 100000,
      "daily_limit": 200000,
      "estimated_time": "1-24h"
    }
  ]
}`,
    },
    {
      method: "POST",
      path: "/orders",
      title: "Criar Pedido",
      description: "Cria um novo pedido. O valor é debitado automaticamente do seu saldo.",
      icon: ShoppingCart,
      request: `{
  "service_id": "uuid-do-servico",
  "link": "https://facebook.com/pagina",
  "quantity": 1000
}`,
      response: `{
  "success": true,
  "data": {
    "id": "uuid-do-pedido",
    "status": "pending",
    "quantity": 1000,
    "total_price": 315.00,
    "link": "https://facebook.com/pagina",
    "created_at": "2024-01-01T00:00:00Z"
  }
}`,
    },
    {
      method: "GET",
      path: "/orders/{id}",
      title: "Ver Estado do Pedido",
      description: "Consulta o estado actual de um pedido específico.",
      icon: Eye,
      request: null,
      response: `{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "processing",
    "quantity": 1000,
    "total_price": 315.00,
    "link": "https://facebook.com/pagina",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T01:00:00Z"
  }
}`,
    },
    {
      method: "GET",
      path: "/orders",
      title: "Listar Pedidos",
      description: "Lista todos os seus pedidos com paginação. Parâmetros: limit (max 100), offset.",
      icon: ShoppingCart,
      request: null,
      response: `{
  "success": true,
  "data": [...],
  "total": 150,
  "limit": 50,
  "offset": 0
}`,
    },
    {
      method: "GET",
      path: "/balance",
      title: "Ver Saldo",
      description: "Consulta o saldo actual da sua conta.",
      icon: Wallet,
      request: null,
      response: `{
  "success": true,
  "data": {
    "balance": 5000.00,
    "currency": "MZN"
  }
}`,
    },
  ];

  const methodColors: Record<string, string> = {
    GET: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    POST: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Code className="w-4 h-4" />
            API de Revenda
          </div>
          <h1 className="text-4xl font-bold mb-4">Documentação da API</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Integre os nossos serviços na sua plataforma. Use a API para criar pedidos,
            consultar estados e gerir o seu saldo programaticamente.
          </p>
        </div>

        {/* Authentication */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              Autenticação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Todas as chamadas à API requerem uma chave de API válida. Inclua a sua chave no header
              <code className="mx-1 px-2 py-0.5 bg-muted rounded text-sm">X-API-Key</code> de cada pedido.
            </p>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm font-mono text-muted-foreground mb-1"># Exemplo com cURL</p>
              <pre className="text-sm overflow-x-auto">
{`curl -H "X-API-Key: rk_sua_chave_aqui" \\
     -H "Content-Type: application/json" \\
     ${displayBaseUrl}/services`}
              </pre>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <ArrowRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm">
                Para obter uma API Key, entre em contacto connosco pelo WhatsApp. Cada chave tem um limite
                diário de pedidos e um desconto configurável.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Status Codes */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Códigos de Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { code: "200", desc: "Sucesso" },
                { code: "201", desc: "Pedido criado com sucesso" },
                { code: "400", desc: "Erro de validação" },
                { code: "401", desc: "API Key inválida ou inactiva" },
                { code: "404", desc: "Recurso não encontrado" },
                { code: "500", desc: "Erro interno do servidor" },
              ].map((s) => (
                <div key={s.code} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                  <Badge variant="outline" className="font-mono">{s.code}</Badge>
                  <span className="text-sm text-muted-foreground">{s.desc}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Order Statuses */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Estados dos Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { status: "pending", label: "Pendente", color: "bg-yellow-500/10 text-yellow-600" },
                { status: "processing", label: "Em Processamento", color: "bg-blue-500/10 text-blue-600" },
                { status: "completed", label: "Concluído", color: "bg-emerald-500/10 text-emerald-600" },
                { status: "cancelled", label: "Cancelado", color: "bg-red-500/10 text-red-600" },
              ].map((s) => (
                <div key={s.status} className="text-center p-3 rounded-lg bg-muted/30">
                  <Badge className={s.color}>{s.status}</Badge>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Endpoints */}
        <h2 className="text-2xl font-bold mb-6">Endpoints</h2>
        <div className="space-y-6">
          {endpoints.map((ep, i) => (
            <Card key={i}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Badge className={`${methodColors[ep.method]} border font-mono`}>{ep.method}</Badge>
                  <code className="text-base">{ep.path}</code>
                </CardTitle>
                <p className="text-muted-foreground">{ep.description}</p>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue={ep.request ? "request" : "response"}>
                  <TabsList>
                    {ep.request && <TabsTrigger value="request">Request Body</TabsTrigger>}
                    <TabsTrigger value="response">Response</TabsTrigger>
                  </TabsList>
                  {ep.request && (
                    <TabsContent value="request">
                      <pre className="bg-muted/50 rounded-lg p-4 text-sm overflow-x-auto">
                        {ep.request}
                      </pre>
                    </TabsContent>
                  )}
                  <TabsContent value="response">
                    <pre className="bg-muted/50 rounded-lg p-4 text-sm overflow-x-auto">
                      {ep.response}
                    </pre>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Rate Limiting */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Limites</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-muted-foreground">
            <p>• Cada API Key tem um limite diário de pedidos configurável (padrão: 1000)</p>
            <p>• O contador é reiniciado diariamente</p>
            <p>• Quando o limite é atingido, a API retorna erro 401</p>
            <p>• Os pedidos são limitados às quantidades mín/máx de cada serviço</p>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default ApiDocs;
