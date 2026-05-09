'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormError } from '@/components/feedback/FormError';
import { Wallet, Check } from 'lucide-react';
import { postJson, type ApiErrorBody } from '@/lib/api/browser';
import { cn } from '@/lib/utils';
import type { Bill, HouseholdMember } from '@/types';

interface BillsBoardProps {
  householdId: number;
  bills: Bill[];
  adultMembers: HouseholdMember[];
}

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function BillsBoard({ householdId, bills, adultMembers }: BillsBoardProps) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  const open = bills.filter((b) => b.status !== 'paid');
  const paid = bills.filter((b) => b.status === 'paid');
  const totalOpen = open.reduce((sum, b) => sum + b.amount, 0);

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Total em aberto: <strong>{BRL.format(totalOpen)}</strong>
        </p>
        <Button onClick={() => setCreating((v) => !v)}>
          {creating ? 'Cancelar' : 'Nova conta'}
        </Button>
      </div>

      {creating ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nova conta</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateBillForm
              householdId={householdId}
              adultMembers={adultMembers}
              onCreated={() => {
                setCreating(false);
                router.refresh();
              }}
            />
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Em aberto</h2>
        {open.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Nenhuma conta em aberto.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {open.map((bill) => (
              <BillRow
                key={bill.id}
                bill={bill}
                householdId={householdId}
                onChange={() => router.refresh()}
              />
            ))}
          </div>
        )}
      </section>

      {paid.length > 0 ? (
        <section className="grid gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Pagas</h2>
          {paid.map((bill) => (
            <div key={bill.id} className="opacity-60">
              <BillRow bill={bill} householdId={householdId} onChange={() => router.refresh()} />
            </div>
          ))}
        </section>
      ) : null}
    </>
  );
}

function BillRow({
  bill,
  householdId,
  onChange,
}: {
  bill: Bill;
  householdId: number;
  onChange: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-primary/10 p-2 text-primary">
              <Wallet className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold">{bill.title}</p>
              <p className="text-xs text-muted-foreground">
                {bill.due_date
                  ? `Vence em ${new Date(bill.due_date).toLocaleDateString('pt-BR')}`
                  : 'Sem vencimento'}
                {bill.category ? ` · ${bill.category}` : ''}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-lg font-bold tabular-nums">{BRL.format(bill.amount)}</span>
            <Badge variant={bill.status === 'paid' ? 'secondary' : 'outline'}>
              {bill.status === 'paid' ? 'Paga' : bill.status === 'overdue' ? 'Atrasada' : 'Aberta'}
            </Badge>
          </div>
        </div>

        {bill.splits && bill.splits.length > 0 ? (
          <div className="space-y-1 rounded-md bg-muted/40 p-2">
            <p className="text-xs font-medium text-muted-foreground">Divisão</p>
            {bill.splits.map((split) => (
              <div key={split.id} className="flex items-center justify-between text-sm">
                <span>
                  {split.user?.name ?? `#${split.user_id}`}{' '}
                  <span className="text-xs text-muted-foreground">{BRL.format(split.share_amount)}</span>
                </span>
                {split.status === 'paid' ? (
                  <Badge variant="secondary">Pago</Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() =>
                      startTransition(async () => {
                        await postJson(
                          `/api/households/${householdId}/bills/${bill.id}/splits/${split.id}/pay`,
                          {},
                        );
                        onChange();
                      })
                    }
                  >
                    Marcar pago
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : null}

        {bill.status !== 'paid' ? (
          <Button
            size="sm"
            className={cn('w-full', bill.splits?.length ? 'mt-1' : '')}
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await postJson(`/api/households/${householdId}/bills/${bill.id}/pay`, {});
                onChange();
              })
            }
          >
            <Check className="mr-1 h-4 w-4" />
            Marcar conta inteira como paga
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function CreateBillForm({
  householdId,
  adultMembers,
  onCreated,
}: {
  householdId: number;
  adultMembers: HouseholdMember[];
  onCreated: () => void;
}) {
  const [error, setError] = useState<ApiErrorBody['error']>();
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const splits = form.getAll('split_user_ids').map((v) => Number(v));
        setError(undefined);
        startTransition(async () => {
          const result = await postJson(`/api/households/${householdId}/bills`, {
            title: form.get('title'),
            amount: Number(form.get('amount')),
            due_date: form.get('due_date') || undefined,
            category: form.get('category') || undefined,
            split_user_ids: splits,
          });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          (event.target as HTMLFormElement).reset();
          onCreated();
        });
      }}
    >
      <FormError error={error} />

      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="b-title">Título</Label>
          <Input id="b-title" name="title" required maxLength={200} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="b-amount">Valor (R$)</Label>
          <Input
            id="b-amount"
            name="amount"
            type="number"
            step="0.01"
            min={0}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="b-due">Vencimento</Label>
          <Input id="b-due" name="due_date" type="date" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="b-cat">Categoria</Label>
          <Input id="b-cat" name="category" placeholder="Ex.: Moradia" maxLength={64} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Dividir entre adultos</Label>
        <div className="grid grid-cols-2 gap-1 rounded-md border p-2">
          {adultMembers.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum adulto adicional na casa.</p>
          ) : (
            adultMembers.map((m) => (
              <label key={m.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="split_user_ids" value={m.user_id} />
                <span>{m.user?.name ?? `#${m.user_id}`}</span>
              </label>
            ))
          )}
        </div>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? '…' : 'Criar conta'}
      </Button>
    </form>
  );
}
