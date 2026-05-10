import { LogoutButton } from '@/components/auth/LogoutButton';
import { AppMenu } from '@/components/layout/AppMenu';

export function TopBar() {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div className="flex min-w-0 items-center gap-2">
        <AppMenu />
        <h1 className="text-sm font-medium text-muted-foreground">Framily</h1>
      </div>
      <div className="flex items-center gap-2">
        <LogoutButton redirectTo="/login" />
      </div>
    </header>
  );
}
