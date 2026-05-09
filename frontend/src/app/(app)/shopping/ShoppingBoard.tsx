'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormError } from '@/components/feedback/FormError';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { postJson, type ApiErrorBody } from '@/lib/api/browser';
import { cn } from '@/lib/utils';
import type { ShoppingItem, ShoppingList } from '@/types';

interface ShoppingBoardProps {
  householdId: number;
  lists: ShoppingList[];
}

export function ShoppingBoard({ householdId, lists }: ShoppingBoardProps) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setCreating((v) => !v)}>
          {creating ? 'Cancelar' : 'Nova lista'}
        </Button>
      </div>

      {creating ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nova lista de compras</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateListForm
              householdId={householdId}
              onCreated={() => {
                setCreating(false);
                router.refresh();
              }}
            />
          </CardContent>
        </Card>
      ) : null}

      {lists.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Nenhuma lista de compras ainda.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {lists.map((list) => (
            <ShoppingListCard
              key={list.id}
              householdId={householdId}
              list={list}
              onChange={() => router.refresh()}
            />
          ))}
        </div>
      )}
    </>
  );
}

function ShoppingListCard({
  householdId,
  list,
  onChange,
}: {
  householdId: number;
  list: ShoppingList;
  onChange: () => void;
}) {
  const items = list.items ?? [];
  const open = items.filter((it) => it.status !== 'bought');
  const bought = items.filter((it) => it.status === 'bought');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">
              <ShoppingCart className="mr-1 inline h-4 w-4 text-primary" />
              {list.name}
            </CardTitle>
            {list.allow_children ? (
              <Badge variant="easy" className="mt-1">
                Crianças autorizadas
              </Badge>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            {open.length}/{items.length} pendentes
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <AddItemForm householdId={householdId} listId={list.id} onAdded={onChange} />

        {open.length === 0 && bought.length === 0 ? (
          <p className="text-sm text-muted-foreground">Lista vazia.</p>
        ) : (
          <ul className="space-y-1">
            {open.map((item) => (
              <ShoppingItemRow
                key={item.id}
                item={item}
                householdId={householdId}
                listId={list.id}
                onChange={onChange}
              />
            ))}
            {bought.length > 0 ? (
              <details>
                <summary className="cursor-pointer text-xs text-muted-foreground">
                  ✓ {bought.length} comprado(s)
                </summary>
                <ul className="mt-1 space-y-1">
                  {bought.map((item) => (
                    <ShoppingItemRow
                      key={item.id}
                      item={item}
                      householdId={householdId}
                      listId={list.id}
                      onChange={onChange}
                      muted
                    />
                  ))}
                </ul>
              </details>
            ) : null}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function ShoppingItemRow({
  item,
  householdId,
  listId,
  onChange,
  muted = false,
}: {
  item: ShoppingItem;
  householdId: number;
  listId: number;
  onChange: () => void;
  muted?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const isBought = item.status === 'bought';

  const toggle = () =>
    startTransition(async () => {
      await postJson(
        `/api/households/${householdId}/shopping-lists/${listId}/items/${item.id}/toggle`,
        {},
      );
      onChange();
    });

  return (
    <li className={cn('flex items-center gap-2 text-sm', muted && 'opacity-60')}>
      <input
        type="checkbox"
        checked={isBought}
        disabled={isPending}
        onChange={toggle}
        className="h-4 w-4 rounded border-input"
      />
      <span className={cn('flex-1', isBought && 'line-through')}>
        {item.name}
        {item.quantity > 1 ? (
          <span className="ml-2 text-xs text-muted-foreground">×{item.quantity}</span>
        ) : null}
        {item.category ? (
          <span className="ml-2 text-xs text-muted-foreground">[{item.category}]</span>
        ) : null}
      </span>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await fetch(
              `/api/households/${householdId}/shopping-lists/${listId}/items/${item.id}`,
              { method: 'DELETE', credentials: 'same-origin' },
            );
            onChange();
          })
        }
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}

function AddItemForm({
  householdId,
  listId,
  onAdded,
}: {
  householdId: number;
  listId: number;
  onAdded: () => void;
}) {
  const [error, setError] = useState<ApiErrorBody['error']>();
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="flex items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setError(undefined);
        startTransition(async () => {
          const result = await postJson(
            `/api/households/${householdId}/shopping-lists/${listId}/items`,
            {
              name: form.get('name'),
              quantity: Number(form.get('quantity') || 1),
            },
          );
          if (!result.ok) {
            setError(result.error);
            return;
          }
          (event.target as HTMLFormElement).reset();
          onAdded();
        });
      }}
    >
      <div className="flex-1">
        <Input name="name" placeholder="Adicionar item…" required maxLength={200} />
      </div>
      <Input name="quantity" type="number" min={1} defaultValue={1} className="w-16" />
      <Button type="submit" disabled={isPending}>
        +
      </Button>
      <div className="absolute"><FormError error={error} /></div>
    </form>
  );
}

function CreateListForm({
  householdId,
  onCreated,
}: {
  householdId: number;
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
        setError(undefined);
        startTransition(async () => {
          const result = await postJson(`/api/households/${householdId}/shopping-lists`, {
            name: form.get('name'),
            allow_children: form.get('allow_children') === 'on',
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

      <div className="space-y-1.5">
        <Label htmlFor="sl-name">Nome</Label>
        <Input id="sl-name" name="name" required maxLength={200} placeholder="Mercado, farmácia…" />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="allow_children" />
        Permitir colaboração das crianças
      </label>

      <Button type="submit" disabled={isPending}>
        {isPending ? '…' : 'Criar lista'}
      </Button>
    </form>
  );
}
