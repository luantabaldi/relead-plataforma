import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Box } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center">
      <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-8">
        <Box className="w-10 h-10 text-primary" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight mb-4">
        LT Consult Platform
      </h1>
      <p className="text-xl text-muted-foreground max-w-lg mb-10">
        Bem-vindo à nova interface de gestão de leads e campanhas. 
        O sistema de design já está configurado e pronto.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild size="lg" className="h-12 px-8">
          <Link href="/styleguide">
            Ver Design System <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button variant="outline" size="lg" className="h-12 px-8" disabled>
          Dashboard (Em breve)
        </Button>
      </div>
      
      <footer className="mt-20 text-sm text-muted-foreground">
        Fase 1: Foundation & Design System
      </footer>
    </div>
  );
}
