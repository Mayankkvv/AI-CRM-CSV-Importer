import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border rounded-2xl border-dashed bg-muted/20 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4 ring-8 ring-background">
        <Icon className="h-8 w-8 opacity-80" />
      </div>
      <h3 className="text-lg font-semibold tracking-tight text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
        {description}
      </p>
    </div>
  );
}
